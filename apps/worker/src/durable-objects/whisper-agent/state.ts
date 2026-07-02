import type { WarmupMetadata } from "../../modules/whisper-session/domain/warmup-metadata";
import type { RecordCompletionResult } from "../../modules/whisper-session/domain/transcription-piggyback";
import type { UsageEntry } from "../../modules/usage/application/ports/usage-tracker";
import type { RunSessionResult } from "./run-session-pipeline";

export interface SessionEntry {
  readonly metadata: WarmupMetadata;
  readonly createdAt: number;
  // Prefetched at warmup so the transcribe hot path skips the dictionary D1
  // round-trip before STT. Absent on prefetch failure → pipeline falls back to
  // a live lookup.
  readonly dictionaryHints?: readonly string[];
  // Set once the pipeline completes. A retry with the same sessionId replays
  // this instead of re-running STT/improve/usage, so retries never double-count.
  readonly result?: RunSessionResult;
  readonly completedAt?: number;
  // Ledger input persisted at completion so reward evaluation survives a DO
  // restart: getRewards can re-run it on demand, and recordUsage is idempotent
  // by entry id so a replay never double-counts.
  readonly usageDraft?: UsageEntry;
  // undefined = evaluation not finished yet; null = evaluation failed (clients
  // get a rewards-less done event instead of hanging).
  readonly rewards?: RecordCompletionResult | null;
}

export interface WhisperSessionState {
  readonly userId: string | undefined;
  readonly sessions: Record<string, SessionEntry>;
}

export const INITIAL_WHISPER_SESSION_STATE: WhisperSessionState = {
  userId: undefined,
  sessions: {},
};

// Entries persist after transcription to back idempotent replay, and abandoned
// warmups (warmup -> never transcribed) never complete. Evict-on-write drops any
// entry older than this (by createdAt) when a new warmup is registered, bounding
// both the idempotency window and abandoned warmups.
export const ABANDONED_SESSION_MAX_AGE_MS = 600_000;
