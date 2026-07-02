import { Effect } from "effect";
import type { SqlClient } from "effect/unstable/sql/SqlClient";
import { DictionaryRepoError } from "../errors";
import type { LearnedWordRepositoryService } from "../application/ports/learned-word-repository";
import type { LearnedWord, LearnedWordId } from "../domain/types";
import { unknownMessage } from "../../../lib/unknown-message";

const wrap =
  (op: string) =>
  (e: unknown): DictionaryRepoError =>
    new DictionaryRepoError({
      message: `learnedWord.${op} failed: ${unknownMessage(e)}`,
    });

type Row = Record<string, unknown>;

const toLearnedWord = (row: Row): LearnedWord => ({
  id: String(row.id) as LearnedWordId,
  source: String(row.source),
  replacement: String(row.replacement),
  sourceLower: String(row.sourceLower),
  context: row.context == null ? null : String(row.context),
  frequency: Number(row.frequency),
  lastUsedAt: Number(row.lastUsedAt),
  createdAt: Number(row.createdAt),
});

const SELECT_COLUMNS = `
  id, source, replacement, source_lower AS sourceLower, context, frequency,
  last_used_at AS lastUsedAt, created_at AS createdAt
`;

export const makeD1LearnedWordRepository = (
  sql: SqlClient,
  userId: string
): LearnedWordRepositoryService => ({
  upsertBySource: (input) =>
    sql`
      INSERT INTO learned_words (
        id, user_id, source, replacement, source_lower, context, frequency,
        last_used_at, created_at
      ) VALUES (
        ${crypto.randomUUID()}, ${userId}, ${input.source}, ${input.replacement},
        ${input.source.toLowerCase()}, ${input.context ?? null}, 1, ${input.now}, ${input.now}
      )
      ON CONFLICT (user_id, source_lower) DO UPDATE SET
        replacement = excluded.replacement,
        context = excluded.context,
        frequency = learned_words.frequency + 1,
        last_used_at = excluded.last_used_at
      RETURNING ${sql.literal(SELECT_COLUMNS)}
    `.pipe(
      Effect.mapError(wrap("upsertBySource")),
      Effect.flatMap((rows: ReadonlyArray<Row>) =>
        rows[0]
          ? Effect.succeed(toLearnedWord(rows[0]))
          : Effect.fail(
              new DictionaryRepoError({ message: "learnedWord.upsertBySource returned no row" })
            )
      )
    ),

  findBySource: (source) =>
    sql`
      SELECT ${sql.literal(SELECT_COLUMNS)}
      FROM learned_words
      WHERE user_id = ${userId} AND source_lower = ${source.toLowerCase()}
      LIMIT 1
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => (rows[0] ? toLearnedWord(rows[0]) : null)),
      Effect.mapError(wrap("findBySource"))
    ),

  listAll: () =>
    sql`
      SELECT ${sql.literal(SELECT_COLUMNS)}
      FROM learned_words
      WHERE user_id = ${userId}
      ORDER BY frequency DESC, last_used_at DESC
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => rows.map(toLearnedWord)),
      Effect.mapError(wrap("listAll"))
    ),

  listTopByFrequency: (limit) =>
    sql`
      SELECT ${sql.literal(SELECT_COLUMNS)}
      FROM learned_words
      WHERE user_id = ${userId}
      ORDER BY frequency DESC, last_used_at DESC
      LIMIT ${limit}
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => rows.map(toLearnedWord)),
      Effect.mapError(wrap("listTopByFrequency"))
    ),
});
