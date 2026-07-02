import { Context, Effect, Layer } from "effect";
import {
  WideEvent,
  type WideEventEnsureOptions,
  type WideEventFailureOptions,
  type WideEventFields,
  type WideEventService,
  type WideEventSuccessOptions,
} from "./wide-event";

export interface ObservabilityService {
  /**
   * Exposes the request-scoped wide event service for rare cases where a caller
   * needs direct access to the underlying contract.
   */
  readonly wideEvent: WideEventService;

  /**
   * Preferred facade for domain code. The implementation may later enrich this
   * with tracing, metrics, experimentation flags, or cross-cutting defaults.
   */
  readonly setWideEvent: (fields: WideEventFields) => Effect.Effect<void>;
  readonly succeedWideEvent: (options?: WideEventSuccessOptions) => Effect.Effect<void>;
  readonly failWideEvent: (
    error: unknown,
    options?: WideEventFailureOptions
  ) => Effect.Effect<void>;
  readonly emitWideEvent: Effect.Effect<void>;
  readonly ensureWideEventEmitted: <A, E, R>(
    effect: Effect.Effect<A, E, R>,
    options?: WideEventEnsureOptions<A, E>
  ) => Effect.Effect<A, E, R>;
}

export class Observability extends Context.Service<Observability, ObservabilityService>()(
  "Observability"
) {}

export const makeObservability = (wideEvent: WideEventService): ObservabilityService => ({
  wideEvent,
  setWideEvent: (fields) => wideEvent.set(fields),
  succeedWideEvent: (options) => wideEvent.succeed(options),
  failWideEvent: (error, options) => wideEvent.fail(error, options),
  emitWideEvent: wideEvent.emit,
  ensureWideEventEmitted: (effect, options) => wideEvent.ensureEmitted(effect, options),
});

export const ObservabilityLive = Layer.effect(
  Observability,
  Effect.map(WideEvent, makeObservability)
);

const noopWideEvent: WideEventService = {
  set: () => Effect.void,
  succeed: () => Effect.void,
  fail: () => Effect.void,
  emit: Effect.void,
  ensureEmitted: (effect) => effect,
};

export const NoopObservabilityLive = Layer.succeed(Observability, makeObservability(noopWideEvent));

/**
 * Pipe-able combinator that records any typed failure into the wide event
 * before letting the error continue. Place it at the end of a use-case so
 * downstream `catchTags` handlers can convert errors to HTTP responses without
 * losing the original tag/payload from the event.
 */
export const captureWideEventError = <A, E, R>(
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R | Observability> =>
  Effect.tapError(effect, (error) =>
    Effect.flatMap(Observability, (obs) => obs.failWideEvent(error))
  );
