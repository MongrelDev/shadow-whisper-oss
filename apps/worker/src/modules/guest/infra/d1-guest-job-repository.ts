import { Effect } from "effect";
import type { GuestJobRepositoryService } from "../application/ports/guest-job-repository";
import type { DemoJob, DemoJobKind, DemoJobPhase } from "../domain/demo-job";
import { GuestJobRepositoryError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";

interface DemoJobRow {
  workflow_id: string;
  kind: DemoJobKind;
  phase: DemoJobPhase;
  surface_id: string | null;
  skill_id: string | null;
  raw_text: string | null;
  clean_text: string | null;
  duration_ms: number | null;
  audio_bytes: number | null;
  word_count: number | null;
  locale: string | null;
  error_message: string | null;
  cancelled_at: number | null;
  phase_updated_at: number;
}

const SELECT_COLUMNS =
  "workflow_id, kind, phase, surface_id, skill_id, raw_text, clean_text, duration_ms, audio_bytes, word_count, locale, error_message, cancelled_at, phase_updated_at";

const rowToJob = (row: DemoJobRow): DemoJob => ({
  workflowId: row.workflow_id,
  kind: row.kind,
  phase: row.phase,
  surfaceId: row.surface_id,
  skillId: row.skill_id,
  rawText: row.raw_text,
  cleanText: row.clean_text,
  durationMs: row.duration_ms,
  audioBytes: row.audio_bytes,
  wordCount: row.word_count,
  locale: row.locale,
  errorMessage: row.error_message,
  cancelledAt: row.cancelled_at,
  phaseUpdatedAt: row.phase_updated_at,
});

const fail = (e: unknown) => new GuestJobRepositoryError({ message: unknownMessage(e) });

export const makeD1GuestJobRepository = (env: Env): GuestJobRepositoryService => {
  const db = env.DB;

  return {
    insert: (input) =>
      Effect.tryPromise({
        try: async () => {
          await db
            .prepare(
              "INSERT INTO demo_transcripts (workflow_id, kind, surface_id, skill_id, raw_text, audio_bytes, word_count, locale, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            )
            .bind(
              input.workflowId,
              input.kind,
              input.surfaceId,
              input.skillId,
              input.rawText,
              input.audioBytes,
              input.wordCount,
              input.locale,
              input.ipHash
            )
            .run();
        },
        catch: fail,
      }),

    markComplete: (input) =>
      Effect.tryPromise({
        try: async () => {
          await db
            .prepare(
              "UPDATE demo_transcripts SET phase = 'complete', raw_text = ?, clean_text = ?, duration_ms = ?, word_count = ?, phase_updated_at = (strftime('%s','now') * 1000), updated_at = (strftime('%s','now') * 1000) WHERE workflow_id = ?"
            )
            .bind(
              input.rawText,
              input.cleanText,
              input.durationMs,
              input.wordCount,
              input.workflowId
            )
            .run();
        },
        catch: fail,
      }),

    markError: (workflowId, message) =>
      Effect.tryPromise({
        try: async () => {
          await db
            .prepare(
              "UPDATE demo_transcripts SET phase = 'error', error_message = ?, phase_updated_at = (strftime('%s','now') * 1000), updated_at = (strftime('%s','now') * 1000) WHERE workflow_id = ?"
            )
            .bind(message, workflowId)
            .run();
        },
        catch: fail,
      }),

    markCancelled: (workflowId) =>
      Effect.tryPromise({
        try: async () => {
          await db
            .prepare(
              "UPDATE demo_transcripts SET phase = 'cancelled', cancelled_at = (strftime('%s','now') * 1000), phase_updated_at = (strftime('%s','now') * 1000), updated_at = (strftime('%s','now') * 1000) WHERE workflow_id = ? AND phase NOT IN ('complete','error','cancelled')"
            )
            .bind(workflowId)
            .run();
        },
        catch: fail,
      }),

    findById: (workflowId) =>
      Effect.tryPromise({
        try: async () => {
          const row = await db
            .prepare(`SELECT ${SELECT_COLUMNS} FROM demo_transcripts WHERE workflow_id = ?`)
            .bind(workflowId)
            .first<DemoJobRow>();
          return row ? rowToJob(row) : null;
        },
        catch: fail,
      }),
  };
};
