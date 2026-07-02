import { Context, Effect, Layer } from "effect";

export interface BackgroundTasksService {
  /**
   * Schedule an Effect to run after the response is returned to the client.
   *
   * The effect is launched via `ExecutionContext.waitUntil`, so the Worker
   * keeps executing it past the HTTP response. Failures are logged but never
   * propagate back to the caller.
   */
  readonly defer: <A, E>(effect: Effect.Effect<A, E>) => Effect.Effect<void>;
}

export class BackgroundTasks extends Context.Service<BackgroundTasks, BackgroundTasksService>()(
  "BackgroundTasks"
) {}

export const makeWaitUntilBackgroundTasks = (
  waitUntil: (promise: Promise<unknown>) => void
): BackgroundTasksService => ({
  defer: (effect) =>
    Effect.sync(() => {
      waitUntil(Effect.runPromise(effect.pipe(Effect.ignore)));
    }),
});

export const BackgroundTasksLive = (waitUntil: (promise: Promise<unknown>) => void) =>
  Layer.succeed(BackgroundTasks, makeWaitUntilBackgroundTasks(waitUntil));
