import { Context, Data, Effect } from "effect";
import { currentUserId } from "../modules/auth/application/current-user";
import { checkRateLimit, type RateLimitBindingName } from "./rate-limit";
import { enrichWideEvent } from "../observability/enrich-wide-event";

export type { RateLimitBindingName };

export class RateLimitedError extends Data.TaggedError("RateLimitedError")<{
  readonly label: string;
}> {}

export class RateLimitCheckError extends Data.TaggedError("RateLimitCheckError")<{
  readonly label: string;
  readonly message: string;
}> {}

export interface RateLimiterService {
  readonly check: (
    binding: RateLimitBindingName,
    key: string
  ) => Effect.Effect<boolean, RateLimitCheckError>;
}

export class RateLimiter extends Context.Service<RateLimiter, RateLimiterService>()(
  "RateLimiter"
) {}

export const makeCloudflareRateLimiter = (env: Env): RateLimiterService => ({
  check: (binding, key) =>
    Effect.tryPromise({
      try: () => checkRateLimit(env, binding, key),
      catch: (e) => new RateLimitCheckError({ label: key, message: String(e) }),
    }),
});

export const enforceUserRateLimit = Effect.fnUntraced(function* (
  label: string,
  bindings: readonly RateLimitBindingName[]
) {
  const limiter = yield* RateLimiter;
  const userId = yield* currentUserId;
  for (const binding of bindings) {
    const success = yield* limiter
      .check(binding, `user:${userId}:${label}`)
      .pipe(
        Effect.catchTag("RateLimitCheckError", (e) =>
          Effect.logError("rate limiter check failed, failing open", e).pipe(Effect.as(true))
        )
      );
    if (!success) {
      yield* enrichWideEvent({ rateLimit: { exceeded: true, binding, label } });
      return yield* new RateLimitedError({ label });
    }
  }
});
