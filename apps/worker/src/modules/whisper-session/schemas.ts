import { Schema } from "effect";
import { AchievementKey, MilestoneKey, SurfaceContext, TrimmedNonEmpty } from "@whisper/api";

export const TranscribeSyncFormFields = Schema.Struct({
  locale: Schema.optional(Schema.String),
  skillId: Schema.optional(Schema.String),
  timezone: Schema.optional(Schema.String),
  language: Schema.optional(Schema.NullOr(Schema.String)),
  platform: Schema.optional(Schema.Literals(["desktop", "extension"])),
  os: Schema.optional(Schema.String),
  surfaceContext: Schema.optional(Schema.NullOr(SurfaceContext)),
});
export type TranscribeSyncFormFields = typeof TranscribeSyncFormFields.Type;

export const WarmupAppContext = Schema.Struct({
  bundleId: Schema.optional(TrimmedNonEmpty),
  host: Schema.optional(Schema.String),
});
export type WarmupAppContext = typeof WarmupAppContext.Type;

const SafeString = Schema.String.check(Schema.isMaxLength(512));
const OptionalSafeString = Schema.optional(SafeString);

export const SessionWarmupMetadata = Schema.Struct({
  surface: Schema.optional(Schema.Literals(["desktop", "extension"])),
  bundleId: OptionalSafeString,
  activeTabHost: OptionalSafeString,
  browser: OptionalSafeString,
  hostname: OptionalSafeString,
  language: OptionalSafeString,
  timezone: OptionalSafeString,
  platform: OptionalSafeString,
  os: OptionalSafeString,
  accessibilityTrusted: Schema.optional(Schema.Boolean),
});
export type SessionWarmupMetadata = typeof SessionWarmupMetadata.Type;

export const SessionWarmupBody = Schema.Struct({
  appContext: Schema.optional(WarmupAppContext),
  metadata: Schema.optional(SessionWarmupMetadata),
});
export type SessionWarmupBody = typeof SessionWarmupBody.Type;

export interface SessionWarmupResponse {
  readonly sessionId: string;
}

export const TRANSCRIBE_SYNC_MAX_BYTES = 10 * 1024 * 1024;
export const TRANSCRIBE_SYNC_DEFAULT_LOCALE = "auto";

export const RecordUsageStats = Schema.Struct({
  todayWordCount: Schema.Number,
  weekWordCount: Schema.Number,
  currentStreak: Schema.Number,
  wpm: Schema.Number,
  hasAnyEntries: Schema.Boolean,
  totalWords: Schema.Number,
  weeklyAvgWpm: Schema.Number,
  isFirstWeek: Schema.Boolean,
});
export type RecordUsageStats = typeof RecordUsageStats.Type;

export const TranscribeSyncResponse = Schema.Struct({
  sessionId: Schema.String,
  rawText: Schema.String,
  improvedText: Schema.String,
  sttEngine: Schema.String,
  durationMs: Schema.Number,
});
export type TranscribeSyncResponse = typeof TranscribeSyncResponse.Type;

// Payload of the `rewards` event on GET /api/sessions/:sessionId/events.
export const SessionRewardsPayload = Schema.Struct({
  unlockedAchievements: Schema.Array(AchievementKey),
  unlockedMilestones: Schema.Array(MilestoneKey),
  stats: RecordUsageStats,
});
export type SessionRewardsPayload = typeof SessionRewardsPayload.Type;
