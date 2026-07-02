import { Context, Effect } from "effect";

export type WideEventValue =
  | string
  | number
  | boolean
  | null
  | ReadonlyArray<WideEventValue>
  | { readonly [key: string]: WideEventValue | undefined };

export type WideEventFields = Readonly<Record<string, WideEventValue | undefined>>;

export interface WideEventSuccessOptions {
  readonly responseStatus?: number;
  readonly fields?: WideEventFields;
}

export interface WideEventFailureOptions {
  readonly responseStatus?: number;
  readonly fields?: WideEventFields;
}

export interface WideEventEnsureOptions<A, E> {
  readonly onSuccess?: (value: A) => WideEventSuccessOptions | undefined;
  readonly onFailure?: (error: E) => WideEventFailureOptions | undefined;
}

export interface WideEventService {
  /**
   * Adds or overwrites fields in the in-flight wide event envelope.
   * This should be cheap and non-emitting.
   */
  readonly set: (fields: WideEventFields) => Effect.Effect<void>;

  /**
   * Merges a final success shape into the event without emitting it yet.
   */
  readonly succeed: (options?: WideEventSuccessOptions) => Effect.Effect<void>;

  /**
   * Merges failure details into the event without emitting it yet.
   * Implementations should normalize the error into a serializable shape.
   */
  readonly fail: (error: unknown, options?: WideEventFailureOptions) => Effect.Effect<void>;

  /**
   * Emits the final event envelope exactly once.
   */
  readonly emit: Effect.Effect<void>;

  /**
   * Wraps an effect and guarantees final event emission on both success and failure.
   * The implementation is responsible for idempotency and for preserving the original exit.
   */
  readonly ensureEmitted: <A, E, R>(
    effect: Effect.Effect<A, E, R>,
    options?: WideEventEnsureOptions<A, E>
  ) => Effect.Effect<A, E, R>;
}

export class WideEvent extends Context.Service<WideEvent, WideEventService>()("WideEvent") {}
