import { Hono } from "hono";
import { Effect } from "effect";
import { AddSnippetBody, AddWordBody, IdParam, effectJson, effectParam } from "@whisper/api";
import { currentUserId } from "../auth/application/current-user";
import { enforceUserRateLimit } from "../../lib/rate-limit-effect";
import { httpDatabase, httpRateLimited, httpUnauthorized } from "../../lib/http-errors";
import { runDictionaryHandler } from "./runtime";
import { DictionaryService } from "./application/dictionary-service";

const RATE_LIMIT_MUTATION = ["RATE_LIMIT_10_PER_MIN"] as const;

const dictionary = new Hono<{ Bindings: Env }>()
  .get("/", (c) => {
    const unauthorized = httpUnauthorized(c);
    const dbError = httpDatabase(c);
    return runDictionaryHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        const svc = yield* DictionaryService;
        const result = yield* svc.getDictionary(userId);
        return c.json(result);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          DictionaryRepositoryError: dbError,
        })
      ),
      "dictionary.get"
    );
  })
  .post("/words", effectJson(AddWordBody, "Word is required"), (c) => {
    const { word } = c.req.valid("json");
    const unauthorized = httpUnauthorized(c);
    const rateLimited = httpRateLimited(c);
    const dbError = httpDatabase(c);
    return runDictionaryHandler(
      c,
      Effect.gen(function* () {
        yield* enforceUserRateLimit("dictionary.mutation", RATE_LIMIT_MUTATION);
        const userId = yield* currentUserId;
        const svc = yield* DictionaryService;
        const result = yield* svc.addWord(userId, word);
        return c.json(result, 201);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          RateLimitedError: rateLimited,
          DictionaryRepositoryError: dbError,
        })
      ),
      "dictionary.word.add"
    );
  })
  .delete("/words/:id", effectParam(IdParam, "Invalid id"), (c) => {
    const { id } = c.req.valid("param");
    const unauthorized = httpUnauthorized(c);
    const rateLimited = httpRateLimited(c);
    const dbError = httpDatabase(c);
    return runDictionaryHandler(
      c,
      Effect.gen(function* () {
        yield* enforceUserRateLimit("dictionary.mutation", RATE_LIMIT_MUTATION);
        const userId = yield* currentUserId;
        const svc = yield* DictionaryService;
        yield* svc.removeWord(userId, id);
        return c.json({ success: true });
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          RateLimitedError: rateLimited,
          DictionaryRepositoryError: dbError,
        })
      ),
      "dictionary.word.remove"
    );
  })
  .post("/snippets", effectJson(AddSnippetBody, "Trigger and expanded text are required"), (c) => {
    const { trigger, expanded } = c.req.valid("json");
    const unauthorized = httpUnauthorized(c);
    const rateLimited = httpRateLimited(c);
    const dbError = httpDatabase(c);
    return runDictionaryHandler(
      c,
      Effect.gen(function* () {
        yield* enforceUserRateLimit("dictionary.mutation", RATE_LIMIT_MUTATION);
        const userId = yield* currentUserId;
        const svc = yield* DictionaryService;
        const result = yield* svc.addSnippet(userId, trigger, expanded);
        return c.json(result, 201);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          RateLimitedError: rateLimited,
          DictionaryRepositoryError: dbError,
        })
      ),
      "dictionary.snippet.add"
    );
  })
  .delete("/snippets/:id", effectParam(IdParam, "Invalid id"), (c) => {
    const { id } = c.req.valid("param");
    const unauthorized = httpUnauthorized(c);
    const rateLimited = httpRateLimited(c);
    const dbError = httpDatabase(c);
    return runDictionaryHandler(
      c,
      Effect.gen(function* () {
        yield* enforceUserRateLimit("dictionary.mutation", RATE_LIMIT_MUTATION);
        const userId = yield* currentUserId;
        const svc = yield* DictionaryService;
        yield* svc.removeSnippet(userId, id);
        return c.json({ success: true });
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          RateLimitedError: rateLimited,
          DictionaryRepositoryError: dbError,
        })
      ),
      "dictionary.snippet.remove"
    );
  });

export default dictionary;
