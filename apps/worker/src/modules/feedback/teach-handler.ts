import { Hono } from "hono";
import { Effect } from "effect";
import { effectJson } from "@whisper/api";
import type { ErrorResponse, IngestTeachResponse } from "@whisper/api";
import { currentUserId } from "../auth/application/current-user";
import { enforceUserRateLimit } from "../../lib/rate-limit-effect";
import { httpRateLimited, httpUnauthorized } from "../../lib/http-errors";
import { TeachBodySchema } from "./schemas";
import { FeedbackService } from "./application/feedback-service";
import { runFeedbackHandler } from "./runtime";

const teach = new Hono<{ Bindings: Env }>().post(
  "/",
  effectJson(TeachBodySchema, "Invalid teach body"),
  (c) => {
    const body = c.req.valid("json");
    const unauthorized = httpUnauthorized(c);
    const rateLimited = httpRateLimited(c);
    return runFeedbackHandler(
      c,
      Effect.gen(function* () {
        yield* enforceUserRateLimit("feedback.teach", ["RATE_LIMIT_10_PER_MIN"]);
        const userId = yield* currentUserId;
        const feedback = yield* FeedbackService;
        const result = yield* feedback.ingestTeach({
          userId,
          selectedText: body.selectedText,
          lastTranscriptionText: body.lastTranscriptionText ?? null,
          source: body.source,
          candidates: body.candidates ?? [],
        });
        return c.json(
          {
            feedbackId: result.feedbackId,
            instanceId: result.instanceId,
          } satisfies IngestTeachResponse,
          202
        );
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          RateLimitedError: rateLimited,
          FeedbackPersistError: (e) =>
            Effect.logWarning("teach ingest failed", e).pipe(
              Effect.as(
                c.json(
                  {
                    error_code: "er_feedback_persist_failed",
                    details: { message: e.message },
                  } satisfies ErrorResponse<"er_feedback_persist_failed", { message: string }>,
                  500
                )
              )
            ),
        })
      ),
      "teach.ingest"
    );
  }
);

export default teach;
