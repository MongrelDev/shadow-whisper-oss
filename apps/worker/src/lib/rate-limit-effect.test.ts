import { describe, expect, it } from "@effect/vitest";
import { Cause, Effect, Exit, Layer } from "effect";
import {
  RateLimiter,
  RateLimitCheckError,
  RateLimitedError,
  enforceUserRateLimit,
} from "./rate-limit-effect";
import { CurrentUser } from "../modules/auth/application/current-user";

const USER_ID = "test-user-1";

const stubCurrentUserLayer = Layer.succeed(CurrentUser, {
  userId: Effect.succeed(USER_ID),
});

const testLayer = (
  check: (binding: string, key: string) => Effect.Effect<boolean, RateLimitCheckError>
) => Layer.mergeAll(stubCurrentUserLayer, Layer.succeed(RateLimiter, { check }));

describe("enforceUserRateLimit", () => {
  it.effect("fails with RateLimitedError when limiter returns false", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        enforceUserRateLimit("test.op", ["RATE_LIMIT_10_PER_MIN"]).pipe(
          Effect.provide(testLayer(() => Effect.succeed(false)))
        )
      );
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = Cause.findErrorOption(exit.cause);
        expect(error._tag).toBe("Some");
        if (error._tag === "Some") {
          expect(error.value).toBeInstanceOf(RateLimitedError);
        }
      }
    })
  );

  it.effect("succeeds (fails open) when limiter check throws RateLimitCheckError", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        enforceUserRateLimit("test.op", ["RATE_LIMIT_10_PER_MIN"]).pipe(
          Effect.provide(
            testLayer(() =>
              Effect.fail(new RateLimitCheckError({ label: "test", message: "binding down" }))
            )
          )
        )
      );
      expect(Exit.isSuccess(exit)).toBe(true);
    })
  );

  it.effect("succeeds when limiter returns true", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        enforceUserRateLimit("test.op", ["RATE_LIMIT_10_PER_MIN"]).pipe(
          Effect.provide(testLayer(() => Effect.succeed(true)))
        )
      );
      expect(Exit.isSuccess(exit)).toBe(true);
    })
  );
});
