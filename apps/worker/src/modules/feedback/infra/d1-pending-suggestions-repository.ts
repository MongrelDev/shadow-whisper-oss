import { Effect } from "effect";
import type { D1Client } from "@effect/sql-d1";
import type {
  PendingSuggestion,
  PendingSuggestionsRepositoryService,
  SuggestionMutationResult,
} from "../application/ports/pending-suggestions-repository";
import { FeedbackPersistError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";

const toPersistError =
  (op: string) =>
  (e: unknown): FeedbackPersistError =>
    new FeedbackPersistError({
      message: `${op} failed: ${unknownMessage(e)}`,
    });

type Row = Record<string, unknown>;

const toPendingSuggestion = (row: Row): PendingSuggestion => ({
  id: String(row.id),
  feedbackId: String(row.feedbackId),
  original: String(row.original),
  replacement: String(row.replacement),
  context: String(row.context),
  selectedText: String(row.selectedText),
  source: String(row.source),
  status: String(row.status),
  createdAt: Number(row.createdAt),
});

export const makeD1PendingSuggestionsRepository = (
  client: D1Client.D1Client
): PendingSuggestionsRepositoryService => {
  const sql = client;
  const db = client.config.db;

  return {
    create: (userId, input) =>
      sql`
        INSERT INTO pending_suggestions (
          id, user_id, feedback_id, original, replacement, context, selected_text,
          status, source, matched_session_id, created_at
        ) VALUES (
          ${crypto.randomUUID()}, ${userId}, ${input.feedbackId}, ${input.original},
          ${input.replacement}, ${input.context}, ${input.selectedText}, ${"pending"},
          ${input.source}, ${input.matchedSessionId}, ${input.now}
        )
        RETURNING id, feedback_id AS feedbackId, original, replacement, context,
          selected_text AS selectedText, source, status, created_at AS createdAt
      `.pipe(
        Effect.mapError(toPersistError("createPendingSuggestion")),
        Effect.flatMap((rows: ReadonlyArray<Row>) =>
          rows[0]
            ? Effect.succeed(toPendingSuggestion(rows[0]))
            : Effect.fail(
                new FeedbackPersistError({
                  message: "createPendingSuggestion returned no row",
                })
              )
        )
      ),

    list: (userId) =>
      sql`
        SELECT id, feedback_id AS feedbackId, original, replacement, context,
          selected_text AS selectedText, source, status, created_at AS createdAt
        FROM pending_suggestions
        WHERE user_id = ${userId} AND status = 'pending'
        ORDER BY created_at DESC
      `.pipe(
        Effect.map((rows: ReadonlyArray<Row>) => rows.map(toPendingSuggestion)),
        Effect.mapError(toPersistError("listPendingSuggestions"))
      ),

    // The learned-word upsert and the pending-suggestion delete must land
    // atomically; D1 batch is the only transactional primitive available.
    accept: (userId, id, now) =>
      Effect.tryPromise({
        try: async (): Promise<SuggestionMutationResult> => {
          const results = await db.batch([
            db
              .prepare(
                `INSERT INTO learned_words (
                   id, user_id, source, replacement, source_lower, context, frequency,
                   last_used_at, created_at
                 )
                 SELECT ?1, user_id, original, replacement, lower(original), context, 1, ?2, ?2
                 FROM pending_suggestions WHERE id = ?3 AND user_id = ?4
                 ON CONFLICT (user_id, source_lower) DO UPDATE SET
                   replacement = excluded.replacement,
                   context = excluded.context,
                   frequency = learned_words.frequency + 1,
                   last_used_at = excluded.last_used_at`
              )
              .bind(crypto.randomUUID(), now, id, userId),
            db
              .prepare(
                `DELETE FROM pending_suggestions WHERE id = ?1 AND user_id = ?2 RETURNING id`
              )
              .bind(id, userId),
          ]);
          const deleted = results[1]?.results ?? [];
          if (deleted.length === 0) return { ok: false, reason: "not_found" };
          return { ok: true };
        },
        catch: toPersistError("acceptPendingSuggestion"),
      }),

    reject: (userId, id) =>
      sql`
        DELETE FROM pending_suggestions WHERE user_id = ${userId} AND id = ${id}
        RETURNING id
      `.pipe(
        Effect.map(
          (rows): SuggestionMutationResult =>
            rows.length === 0 ? { ok: false, reason: "not_found" } : { ok: true }
        ),
        Effect.mapError(toPersistError("rejectPendingSuggestion"))
      ),
  };
};
