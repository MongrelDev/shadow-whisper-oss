import { Hono } from "hono";
import { Effect } from "effect";
import { requireWebOrigin, corsForCredentials } from "../../middleware/web-origin";
import { rateLimit, byIp } from "../../middleware/rate-limit";
import { Observability } from "../../observability/observability";
import { validationResponse } from "../../lib/http-errors";
import {
  decodeFormData,
  decodeJsonSchema,
  optionalStringField,
  requireBlobField,
} from "../../lib/multipart";
import { DEMO_AUDIO_MAX_BYTES } from "./domain/allowed-skills";
import { SkillRepository } from "../skills/application/ports/skill-repository";
import { GuestHttp } from "./http-errors";
import { runGuestHandler } from "./runtime";
import { TransformDemoRequest, type DemoSkillsResponse } from "./schemas";
import { GuestService } from "./application/guest-service";

const guest = new Hono<{ Bindings: Env }>();

guest
  .options("/warmup", corsForCredentials())
  .post("/warmup", corsForCredentials(), requireWebOrigin(), (c) => {
    const http = GuestHttp(c);
    return runGuestHandler(
      c,
      Effect.gen(function* () {
        const guestSvc = yield* GuestService;
        const result = yield* guestSvc.warmupGuest({
          cookieHeader: c.req.header("cookie") ?? null,
        });
        if (result.setCookieHeader) c.header("Set-Cookie", result.setCookieHeader);
        return c.json({ sessionId: result.sessionId });
      }).pipe(Effect.catchTags({ BootError: http.bootFailed })),
      "guest.warmup"
    );
  });

guest.get("/skills", requireWebOrigin(), (c) =>
  runGuestHandler(
    c,
    Effect.gen(function* () {
      const obs = yield* Observability;
      const skills = yield* SkillRepository;
      const transformers = skills.listDemo().map((s) => ({
        id: s.id,
        label: s.displayName,
        description: s.description,
      }));
      yield* obs.setWideEvent({
        "guest.requestOperation": "list_skills",
        guestKind: "catalog",
        transformerCount: transformers.length,
      });
      const response: DemoSkillsResponse = { transformers };
      return c.json(response);
    }),
    "guest.skills.list"
  )
);

const guestSessions = new Hono<{ Bindings: Env }>();

guestSessions
  .post(
    "/:sessionId/transcribe",
    corsForCredentials(),
    requireWebOrigin(),
    rateLimit("RATE_LIMIT_5_PER_MIN", byIp("guest:transcribe")),
    (c) => {
      const http = GuestHttp(c);
      return runGuestHandler(
        c,
        Effect.gen(function* () {
          const guestSvc = yield* GuestService;
          const form = yield* decodeFormData(c.req.raw, { maxBytes: DEMO_AUDIO_MAX_BYTES });
          const audio = yield* requireBlobField(form, "audio", { maxBytes: DEMO_AUDIO_MAX_BYTES });
          const locale = optionalStringField(form, "locale", "auto");
          const result = yield* guestSvc.startTranscribeJob({
            cookieHeader: c.req.header("cookie") ?? null,
            sessionId: c.req.param("sessionId"),
            audio,
            locale,
          });
          return c.json(result);
        }).pipe(
          Effect.catchTags({
            MultipartTooLargeError: http.multipartTooLarge,
            MultipartParseError: http.multipartParse,
            MultipartValidationError: http.multipartValidation,
            GuestSessionAuthError: http.sessionAuthFailed,
            BootError: http.bootFailed,
            GuestJobRepositoryError: http.jobRepoFailed,
            SpeechToTextError: http.workflowStartFailed,
          })
        ),
        "guest.session.transcribe"
      );
    }
  )
  .post(
    "/:sessionId/skills",
    corsForCredentials(),
    requireWebOrigin(),
    rateLimit("RATE_LIMIT_5_PER_MIN", byIp("guest:skill")),
    (c) => {
      const http = GuestHttp(c);
      return runGuestHandler(
        c,
        Effect.gen(function* () {
          const guestSvc = yield* GuestService;
          const skills = yield* SkillRepository;
          const body = yield* decodeJsonSchema(c.req.raw, TransformDemoRequest);
          const isDemoSkill = skills.listDemo().some((s) => s.id === body.skillId);
          if (!isDemoSkill) return validationResponse(c, "Skill not allowed");
          const result = yield* guestSvc.startSkillJob({
            cookieHeader: c.req.header("cookie") ?? null,
            sessionId: c.req.param("sessionId"),
            skillId: body.skillId,
            locale: body.locale ?? "auto",
            inputText: body.text,
          });
          return c.json(result);
        }).pipe(
          Effect.catchTags({
            JsonParseError: http.jsonParse,
            JsonValidationError: http.jsonValidation,
            GuestSessionAuthError: http.sessionAuthFailed,
            BootError: http.bootFailed,
            GuestJobRepositoryError: http.jobRepoFailed,
          })
        ),
        "guest.session.skill"
      );
    }
  );

guest.route("/sessions", guestSessions);

export default guest;
