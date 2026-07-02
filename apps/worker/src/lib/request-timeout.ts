import { Duration, Effect } from "effect";

export const REQUEST_TIMEOUT_MS = 30_000;

// Caps an external AI call. On expiry the inner fiber is interrupted — any
// AbortSignal wired into Effect.tryPromise is aborted, so a raw fetch is truly
// cancelled rather than left hanging — and the call fails with the provided
// (transient) error so the caller can retry or fall back.
export const withRequestTimeout =
  <E>(onTimeout: () => E) =>
  <A, R>(self: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.timeoutOrElse(self, {
      duration: Duration.millis(REQUEST_TIMEOUT_MS),
      orElse: () => Effect.fail(onTimeout()),
    });
