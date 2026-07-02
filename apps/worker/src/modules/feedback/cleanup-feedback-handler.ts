import { Hono } from "hono";
import { Effect } from "effect";
import { effectJson, CleanupFeedbackBody } from "@whisper/api";
import type { MutationSuccessResponse } from "@whisper/api";
import { currentUserId } from "../auth/application/current-user";
import { enforceUserRateLimit } from "../../lib/rate-limit-effect";
import { httpUnauthorized, httpRateLimited } from "../../lib/http-errors";
import { CleanupFeedbackRepository } from "./application/ports/cleanup-feedback-repository";
import { runFeedbackHandler } from "./runtime";

const cleanupFeedback = new Hono<{ Bindings: Env }>().post(
  "/cleanup",
  effectJson(CleanupFeedbackBody, "Invalid cleanup feedback body"),
  (c) => {
    const body = c.req.valid("json");
    const unauthorized = httpUnauthorized(c);
    const rateLimited = httpRateLimited(c);
    const accepted = c.json({ success: true } satisfies MutationSuccessResponse);

    return runFeedbackHandler(
      c,
      Effect.gen(function* () {
        yield* enforceUserRateLimit("feedback.cleanup", ["RATE_LIMIT_10_PER_MIN"]);
        const userId = yield* currentUserId;
        const repository = yield* CleanupFeedbackRepository;
        yield* repository.record({ userId, ...body });
        return accepted;
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          RateLimitedError: rateLimited,
        }),
        Effect.catchTag("FeedbackPersistError", (e) =>
          Effect.logWarning("cleanup feedback insert failed", e).pipe(Effect.as(accepted))
        )
      ),
      "feedback.cleanup"
    );
  }
);

export default cleanupFeedback;
