import { Effect, Layer } from "effect";
import { AuthService } from "../server";
import { CurrentUser, UnauthorizedError } from "../application/current-user";

export const CurrentUserLive = (headers: Headers): Layer.Layer<CurrentUser, never, AuthService> =>
  Layer.effect(
    CurrentUser,
    Effect.gen(function* () {
      const auth = yield* AuthService;
      const resolve = Effect.tryPromise({
        try: () => auth.api.getSession({ headers }),
        catch: () => new UnauthorizedError({ reason: "session_lookup_failed" }),
      }).pipe(
        Effect.flatMap((session) =>
          session?.user?.id
            ? Effect.succeed(session.user.id)
            : Effect.fail(new UnauthorizedError({ reason: "no_session" }))
        )
      );
      const cached = yield* Effect.cached(resolve);
      return CurrentUser.of({ userId: cached });
    })
  );
