import { Hono } from "hono";
import { Effect } from "effect";
import type { ErrorResponse } from "@whisper/api";
import { currentUserId } from "../auth/application/current-user";
import { httpDatabase, httpUnauthorized } from "../../lib/http-errors";
import { PendingSuggestionsRepository } from "./application/ports/pending-suggestions-repository";
import { runFeedbackHandler } from "./runtime";

const suggestionNotFoundResponse = (c: Parameters<typeof httpUnauthorized>[0]): Response =>
  c.json(
    {
      error_code: "er_suggestion_not_found",
    } satisfies ErrorResponse<"er_suggestion_not_found">,
    404
  );

const suggestions = new Hono<{ Bindings: Env }>()
  .get("/pending", (c) => {
    const unauthorized = httpUnauthorized(c);
    const dbError = httpDatabase(c);
    return runFeedbackHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        const repo = yield* PendingSuggestionsRepository;
        const pending = yield* repo.list(userId);
        return c.json({ suggestions: pending });
      }).pipe(
        Effect.catchTag("UnauthorizedError", unauthorized),
        Effect.catchTag("FeedbackPersistError", dbError)
      ),
      "feedback.suggestions.pending"
    );
  })
  .post("/:id/accept", (c) => {
    const id = c.req.param("id");
    const unauthorized = httpUnauthorized(c);
    const dbError = httpDatabase(c);
    return runFeedbackHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        const repo = yield* PendingSuggestionsRepository;
        const result = yield* repo.accept(userId, id, Date.now());
        if (!result.ok) return suggestionNotFoundResponse(c);
        return c.json({ success: true as const });
      }).pipe(
        Effect.catchTag("UnauthorizedError", unauthorized),
        Effect.catchTag("FeedbackPersistError", dbError)
      ),
      "feedback.suggestions.accept"
    );
  })
  .post("/:id/reject", (c) => {
    const id = c.req.param("id");
    const unauthorized = httpUnauthorized(c);
    const dbError = httpDatabase(c);
    return runFeedbackHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        const repo = yield* PendingSuggestionsRepository;
        const result = yield* repo.reject(userId, id);
        if (!result.ok) return suggestionNotFoundResponse(c);
        return c.json({ success: true as const });
      }).pipe(
        Effect.catchTag("UnauthorizedError", unauthorized),
        Effect.catchTag("FeedbackPersistError", dbError)
      ),
      "feedback.suggestions.reject"
    );
  });

export default suggestions;
