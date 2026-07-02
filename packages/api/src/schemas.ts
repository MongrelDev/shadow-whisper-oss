import { Result, Schema } from "effect";
import type { TypedResponse } from "hono";
import { validator } from "hono/validator";
import type { ErrorResponse } from "./errors";

type ApiValidationErrorResponse = TypedResponse<
  ErrorResponse<"er_validation", { message: string }>,
  400,
  "json"
>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const effectJson = <S extends Schema.Codec<unknown, unknown>>(
  schema: S,
  errorMessage: string
) =>
  validator("json", (value, c): S["Type"] | ApiValidationErrorResponse => {
    const result = Schema.decodeUnknownResult(schema)(value);

    if (Result.isSuccess(result)) {
      return result.success;
    }

    return c.json(
      {
        error_code: "er_validation",
        details: { message: errorMessage },
      } satisfies ErrorResponse<"er_validation", { message: string }>,
      400
    );
  });

export const TrimmedNonEmpty = Schema.Trim.check(Schema.isNonEmpty());

export const Email = Schema.String.check(Schema.isPattern(EMAIL_REGEX)).pipe(Schema.brand("Email"));
export type Email = typeof Email.Type;

export const AddWordBody = Schema.Struct({
  word: TrimmedNonEmpty,
});
export type AddWordBody = typeof AddWordBody.Type;

export const AddSnippetBody = Schema.Struct({
  trigger: TrimmedNonEmpty,
  expanded: TrimmedNonEmpty,
});
export type AddSnippetBody = typeof AddSnippetBody.Type;

export const BuildSkillBody = Schema.Struct({
  description: TrimmedNonEmpty.check(Schema.isMaxLength(2000)),
});
export type BuildSkillBody = typeof BuildSkillBody.Type;

export const CreateSkillBody = Schema.Struct({
  markdown: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(20_000)),
  displayName: TrimmedNonEmpty.check(Schema.isMaxLength(100)),
  description: Schema.String.check(Schema.isMaxLength(500)),
  slug: TrimmedNonEmpty.check(Schema.isMaxLength(100)),
  triggers: Schema.Array(Schema.String.check(Schema.isMaxLength(50))).check(Schema.isMaxLength(20)),
});
export type CreateSkillBody = typeof CreateSkillBody.Type;

export const UpdateSkillBody = Schema.Struct({
  markdown: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(20_000)),
  displayName: TrimmedNonEmpty.check(Schema.isMaxLength(100)),
  description: Schema.String.check(Schema.isMaxLength(500)),
  slug: TrimmedNonEmpty.check(Schema.isMaxLength(100)),
  triggers: Schema.Array(Schema.String.check(Schema.isMaxLength(50))).check(Schema.isMaxLength(20)),
});
export type UpdateSkillBody = typeof UpdateSkillBody.Type;

export const DailyBreakdownQuery = Schema.Struct({
  from: Schema.String,
  to: Schema.String,
});
export type DailyBreakdownQuery = typeof DailyBreakdownQuery.Type;

export const ExecuteSkillBody = Schema.Struct({
  inputText: TrimmedNonEmpty.check(Schema.isMaxLength(50_000)),
  os: Schema.optional(Schema.String),
  timezone: Schema.optional(Schema.String),
  language: Schema.optional(Schema.NullOr(Schema.String)),
});
export type ExecuteSkillBody = typeof ExecuteSkillBody.Type;

export const WarmupAppContext = Schema.Struct({
  app: TrimmedNonEmpty,
  subject: Schema.optional(Schema.String),
  body: Schema.optional(Schema.String),
});
export type WarmupAppContext = typeof WarmupAppContext.Type;

export const WhisperWarmupBody = Schema.Struct({
  sessionId: TrimmedNonEmpty,
  bundleId: Schema.optional(TrimmedNonEmpty),
  name: Schema.optional(TrimmedNonEmpty),
  locale: TrimmedNonEmpty,
  appContext: Schema.optional(WarmupAppContext),
});
export type WhisperWarmupBody = typeof WhisperWarmupBody.Type;

export const SessionWarmupAppContext = Schema.Struct({
  bundleId: Schema.optional(TrimmedNonEmpty),
  host: Schema.optional(Schema.String),
});
export type SessionWarmupAppContext = typeof SessionWarmupAppContext.Type;

export const ACHIEVEMENT_KEYS = [
  "first_transcription",
  "streak_7",
  "daily_1k_words",
  "marathon_session",
  "speed_100wpm",
  "app_variety_5",
  "bilingual",
  "streak_30",
  "streak_90",
  "daily_3k_words",
  "daily_5k_words",
  "speed_130wpm",
  "skill_explorer",
  "omnichannel",
] as const;

export const AchievementKey = Schema.Literals(ACHIEVEMENT_KEYS);
export type AchievementKey = typeof AchievementKey.Type;

export const MILESTONE_KEYS = [
  "milestone_10k",
  "milestone_25k",
  "milestone_50k",
  "milestone_100k",
  "milestone_250k",
  "milestone_500k",
] as const;

export const MilestoneKey = Schema.Literals(MILESTONE_KEYS);
export type MilestoneKey = typeof MilestoneKey.Type;

export const SURFACE_CONTEXTS = [
  "chat-input",
  "comment",
  "editor",
  "search",
  "form-field",
  "url-bar",
  "other",
] as const;

export const SurfaceContext = Schema.Literals(SURFACE_CONTEXTS);
export type SurfaceContext = typeof SurfaceContext.Type;

const SafeStr = Schema.String.check(Schema.isMaxLength(512));
const OptSafeStr = Schema.optional(SafeStr);

export const SessionWarmupMetadata = Schema.Struct({
  surface: Schema.optional(Schema.Literals(["desktop", "extension"])),
  bundleId: OptSafeStr,
  activeTabHost: OptSafeStr,
  browser: OptSafeStr,
  hostname: OptSafeStr,
  language: OptSafeStr,
  timezone: OptSafeStr,
  platform: OptSafeStr,
  os: OptSafeStr,
  accessibilityTrusted: Schema.optional(Schema.Boolean),
});
export type SessionWarmupMetadata = typeof SessionWarmupMetadata.Type;

export const SessionWarmupBody = Schema.Struct({
  appContext: Schema.optional(SessionWarmupAppContext),
  metadata: Schema.optional(SessionWarmupMetadata),
});
export type SessionWarmupBody = typeof SessionWarmupBody.Type;

export const IdParam = Schema.Struct({
  id: Schema.NumberFromString.check(Schema.isInt(), Schema.isGreaterThan(0)),
});
export type IdParam = typeof IdParam.Type;

export const StringIdParam = Schema.Struct({
  id: Schema.String,
});
export type StringIdParam = typeof StringIdParam.Type;

export const CheckoutVerifyQuery = Schema.Struct({
  token: Schema.String,
});
export type CheckoutVerifyQuery = typeof CheckoutVerifyQuery.Type;

export const AffiliateSignupBody = Schema.Struct({
  name: TrimmedNonEmpty,
  email: Schema.Trim.check(Schema.isPattern(EMAIL_REGEX)).pipe(Schema.brand("Email")),
  password: Schema.String.check(Schema.isMinLength(8), Schema.isMaxLength(128)),
  code: TrimmedNonEmpty,
  callbackURL: Schema.optional(Schema.String),
});
export type AffiliateSignupBody = typeof AffiliateSignupBody.Type;

export const EmailStatusBody = Schema.Struct({
  email: TrimmedNonEmpty,
});
export type EmailStatusBody = typeof EmailStatusBody.Type;

export const GoogleTokenBody = Schema.Struct({
  code: TrimmedNonEmpty,
  codeVerifier: TrimmedNonEmpty,
  redirectUri: TrimmedNonEmpty,
});
export type GoogleTokenBody = typeof GoogleTokenBody.Type;

export type GuestTranscribeForm = {
  audio: Blob | File;
  locale?: string;
};

export const GuestTransformBody = Schema.Struct({
  text: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(5000)),
  skillId: TrimmedNonEmpty,
  locale: Schema.optional(Schema.String),
});
export type GuestTransformBody = typeof GuestTransformBody.Type;

export const TeachCandidatePair = Schema.Struct({
  from: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(64)),
  to: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(64)),
});
export type TeachCandidatePair = typeof TeachCandidatePair.Type;

export const IngestTeachBody = Schema.Struct({
  selectedText: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(4000)),
  lastTranscriptionText: Schema.NullOr(Schema.String.check(Schema.isMaxLength(8000))),
  source: Schema.optional(Schema.Literals(["manual", "auto-edit"])),
  candidates: Schema.optional(Schema.Array(TeachCandidatePair).check(Schema.isMaxLength(20))),
});
export type IngestTeachBody = typeof IngestTeachBody.Type;

export const CleanupFeedbackBody = Schema.Struct({
  rating: Schema.Literals(["like", "dislike"]),
  rawText: Schema.String.check(Schema.isMaxLength(50_000)),
  formattedText: Schema.String.check(Schema.isMaxLength(50_000)),
  language: Schema.String,
  wordCount: Schema.Number,
  diffRatio: Schema.Number,
  transcriptionCreatedAt: Schema.String,
  platform: Schema.Literals(["desktop", "extension"]),
  os: Schema.String,
  bundleId: Schema.NullOr(Schema.String),
  host: Schema.NullOr(Schema.String),
  appCategory: Schema.NullOr(Schema.String),
  installedSkillCount: Schema.NullOr(Schema.Number),
});
export type CleanupFeedbackBody = typeof CleanupFeedbackBody.Type;

export const effectParam = <S extends Schema.Codec<unknown, unknown>>(
  schema: S,
  errorMessage: string
) =>
  validator("param", (value, c): S["Type"] | ApiValidationErrorResponse => {
    const result = Schema.decodeUnknownResult(schema)(value);

    if (Result.isSuccess(result)) {
      return result.success;
    }

    return c.json(
      {
        error_code: "er_validation",
        details: { message: errorMessage },
      } satisfies ErrorResponse<"er_validation", { message: string }>,
      400
    );
  });
