import { Hono } from "hono";
import { Effect, Schema } from "effect";
import { effectJson, SURFACE_CONTEXTS, type SurfaceContext } from "@whisper/api";
import { currentUserId } from "../auth/application/current-user";
import { httpUnauthorized } from "../../lib/http-errors";
import { decodeFormData, optionalStringField, requireBlobField } from "../../lib/multipart";
import { runWhisperSessionHandler } from "./runtime";
import {
  SessionRewardsPayload,
  SessionWarmupBody,
  TRANSCRIBE_SYNC_DEFAULT_LOCALE,
  TRANSCRIBE_SYNC_MAX_BYTES,
} from "./schemas";
import { WhisperSessionService } from "./application/whisper-session-service";
import { WhisperTranscriptionService } from "./application/whisper-transcription-service";
import { WhisperRewardsService } from "./application/whisper-rewards-service";
import { WhisperSessionHttp } from "./http-errors";
import type { WarmupMetadata } from "./domain/warmup-metadata";

interface ClientDimensions {
  readonly timezone: string;
  readonly language: string | null;
  readonly platform: "desktop" | "extension";
  readonly os: string;
  readonly surfaceContext: SurfaceContext | null;
}

const resolveSurfaceContext = (raw: string): SurfaceContext | null => {
  if (!raw) return null;
  return (SURFACE_CONTEXTS as readonly string[]).includes(raw) ? (raw as SurfaceContext) : "other";
};

const readClientDimensions = (form: FormData): ClientDimensions => {
  const rawPlatform = optionalStringField(form, "platform", "desktop");
  const rawLanguage = optionalStringField(form, "language", "");
  return {
    timezone: optionalStringField(form, "timezone", "UTC"),
    language: rawLanguage || null,
    platform: rawPlatform === "extension" ? "extension" : "desktop",
    os: optionalStringField(form, "os", "unknown"),
    surfaceContext: resolveSurfaceContext(optionalStringField(form, "surfaceContext", "")),
  };
};

type RawMeta = NonNullable<SessionWarmupBody["metadata"]>;
type RawAppCtx = NonNullable<SessionWarmupBody["appContext"]>;

const commonBase = (userId: string, issuedAt: number) => ({
  sessionId: "",
  subjectType: "user" as const,
  subjectId: userId,
  issuedAt,
});

function buildExtensionMeta(userId: string, issuedAt: number, meta: RawMeta): WarmupMetadata {
  return {
    ...commonBase(userId, issuedAt),
    surface: "extension" as const,
    bundleId: meta.bundleId,
    activeTabHost: meta.activeTabHost,
    browser: meta.browser,
    hostname: meta.hostname,
    language: meta.language,
    timezone: meta.timezone,
    platform: meta.platform,
    os: meta.os,
  };
}

function buildDesktopMeta(userId: string, issuedAt: number, meta: RawMeta): WarmupMetadata {
  return {
    ...commonBase(userId, issuedAt),
    surface: "desktop" as const,
    bundleId: meta.bundleId,
    activeTabHost: meta.activeTabHost,
    hostname: meta.hostname,
    language: meta.language,
    timezone: meta.timezone,
    platform: meta.platform,
    os: meta.os,
    accessibilityTrusted: meta.accessibilityTrusted,
  };
}

function buildLegacyMeta(userId: string, issuedAt: number, appCtx: RawAppCtx): WarmupMetadata {
  return {
    ...commonBase(userId, issuedAt),
    surface: "desktop" as const,
    bundleId: appCtx.bundleId ?? undefined,
    hostname: appCtx.host ?? undefined,
  };
}

function resolveMetadataVariant(
  userId: string,
  issuedAt: number,
  body: SessionWarmupBody
): WarmupMetadata {
  const { metadata: meta, appContext: appCtx } = body;
  if (meta?.surface === "extension") return buildExtensionMeta(userId, issuedAt, meta);
  if (meta) return buildDesktopMeta(userId, issuedAt, meta);
  return buildLegacyMeta(userId, issuedAt, appCtx ?? {});
}

function buildWarmupMetadata(userId: string, body: SessionWarmupBody): WarmupMetadata {
  return resolveMetadataVariant(userId, Date.now(), body);
}

const whisperSession = new Hono<{ Bindings: Env }>()
  .post("/warmup", effectJson(SessionWarmupBody, "Invalid warmup body"), (c) => {
    const body = c.req.valid("json");
    const http = WhisperSessionHttp(c);
    const unauthorized = httpUnauthorized(c);

    return runWhisperSessionHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        const session = yield* WhisperSessionService;
        const warmupMetadata = buildWarmupMetadata(userId, body);
        const result = yield* session.warmupSession({
          userId,
          warmupMetadata,
        });
        return c.json(result);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          LimitExceededError: http.limitExceeded,
          WarmupError: http.warmup,
        })
      ),
      "session.warmup"
    );
  })
  .post("/:sessionId/transcribe", (c) => {
    const sessionId = c.req.param("sessionId");
    const http = WhisperSessionHttp(c);
    const unauthorized = httpUnauthorized(c);

    return runWhisperSessionHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        const form = yield* decodeFormData(c.req.raw, { maxBytes: TRANSCRIBE_SYNC_MAX_BYTES });
        const audio = yield* requireBlobField(form, "audio", {
          maxBytes: TRANSCRIBE_SYNC_MAX_BYTES,
        });

        const transcription = yield* WhisperTranscriptionService;
        const response = yield* transcription.transcribeSync({
          userId,
          sessionId,
          audio,
          contentType: audio.type || "audio/webm",
          locale: optionalStringField(form, "locale", TRANSCRIBE_SYNC_DEFAULT_LOCALE),
          skillId: optionalStringField(form, "skillId", ""),
          ...readClientDimensions(form),
        });
        return c.json(response);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          WarmupError: http.warmup,
          LimitExceededError: http.limitExceeded,
          TranscriptionFailedError: http.transcriptionFailed,
          SkillResolutionError: http.multipartValidation,
          MultipartTooLargeError: http.multipartTooLarge,
          MultipartParseError: http.multipartParse,
          MultipartValidationError: http.multipartValidation,
        })
      ),
      "session.transcribe"
    );
  })
  // One-shot SSE stream: emits a `rewards` event once async evaluation lands
  // (or a bare `done` when there is nothing to deliver), then closes. Framed as
  // SSE so future event kinds (analytics, partial transcripts) reuse the channel.
  .get("/:sessionId/events", (c) => {
    const sessionId = c.req.param("sessionId");
    const http = WhisperSessionHttp(c);
    const unauthorized = httpUnauthorized(c);

    return runWhisperSessionHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        const rewards = yield* WhisperRewardsService;
        const result = yield* rewards.waitForRewards({ userId, sessionId });

        const events: string[] = [];
        if (result) {
          const payload = yield* Schema.encodeEffect(SessionRewardsPayload)({
            unlockedAchievements: result.unlockedAchievements,
            unlockedMilestones: result.unlockedMilestones,
            stats: result.stats,
          });
          // @effect-diagnostics-next-line preferSchemaOverJson:off
          events.push(`event: rewards\ndata: ${JSON.stringify(payload)}\n\n`);
        }
        events.push("event: done\ndata: {}\n\n");

        return c.body(events.join(""), 200, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
        });
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          WarmupError: http.warmup,
          TranscriptionFailedError: http.transcriptionFailed,
          SchemaError: () => Effect.succeed(c.text("encode failed", 500)),
        })
      ),
      "session.events"
    );
  });

export default whisperSession;
