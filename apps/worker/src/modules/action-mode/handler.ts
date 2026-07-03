import { Hono } from "hono";
import { Effect } from "effect";
import { SURFACE_CONTEXTS, type SurfaceContext } from "@whisper/api";
import { currentUserId } from "../auth/application/current-user";
import { httpRateLimited, httpUnauthorized } from "../../lib/http-errors";
import { enforceUserRateLimit } from "../../lib/rate-limit-effect";
import {
  decodeFormData,
  MultipartValidationError,
  optionalStringField,
  requireBlobField,
} from "../../lib/multipart";
import { runActionModeHandler } from "./runtime";
import { ActionModeService } from "./application/action-mode-service";
import { ActionModeHttp } from "./http-errors";
import {
  ACTION_MODE_DEFAULT_LOCALE,
  ACTION_MODE_MAX_BYTES,
  ACTION_MODE_MAX_SELECTED_TEXT_LENGTH,
} from "./schemas";

const MAX_APP_FIELD_LENGTH = 512;

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

const readBoundedField = (form: FormData, name: string, maxLength: number) =>
  Effect.gen(function* () {
    const raw = optionalStringField(form, name, "");
    if (!raw) return null;
    if (raw.length > maxLength) {
      return yield* new MultipartValidationError({ message: `${name} exceeds ${maxLength} chars` });
    }
    return raw;
  });

const actionMode = new Hono<{ Bindings: Env }>().post("/execute", (c) => {
  const http = ActionModeHttp(c);
  const unauthorized = httpUnauthorized(c);

  return runActionModeHandler(
    c,
    Effect.gen(function* () {
      yield* enforceUserRateLimit("action-mode.execute", ["RATE_LIMIT_10_PER_MIN"]);
      const userId = yield* currentUserId;
      const form = yield* decodeFormData(c.req.raw, { maxBytes: ACTION_MODE_MAX_BYTES });
      const audio = yield* requireBlobField(form, "audio", { maxBytes: ACTION_MODE_MAX_BYTES });

      const selectedText = yield* readBoundedField(
        form,
        "selectedText",
        ACTION_MODE_MAX_SELECTED_TEXT_LENGTH
      );
      const bundleId = yield* readBoundedField(form, "bundleId", MAX_APP_FIELD_LENGTH);
      const siteHost = yield* readBoundedField(form, "siteHost", MAX_APP_FIELD_LENGTH);

      const service = yield* ActionModeService;
      const response = yield* service.execute({
        userId,
        audio,
        contentType: audio.type || "audio/webm",
        locale: optionalStringField(form, "locale", ACTION_MODE_DEFAULT_LOCALE),
        selectedText,
        bundleId,
        siteHost,
        ...readClientDimensions(form),
      });
      return c.json(response);
    }).pipe(
      Effect.catchTags({
        UnauthorizedError: unauthorized,
        RateLimitedError: httpRateLimited(c),
        LimitExceededError: http.limitExceeded,
        ActionModeExecutionError: http.executionFailed,
        MultipartTooLargeError: http.multipartTooLarge,
        MultipartParseError: http.multipartParse,
        MultipartValidationError: http.multipartValidation,
      })
    ),
    "action-mode.execute"
  );
});

export default actionMode;
