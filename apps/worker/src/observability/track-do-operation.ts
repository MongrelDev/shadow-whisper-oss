import { Effect } from "effect";
import { emitOneShotWideEvent } from "./emit-one-shot-wide-event";
import type { WideEventFields } from "./wide-event";

/**
 * Wrap a Durable Object RPC operation so it emits exactly one wide event with
 * success/failure outcome and duration. Durable Objects have no HTTP request to
 * anchor a request-scoped event, so each operation gets its own one-shot event
 * (same approach as the WhisperAgent observability layer). The original
 * value/throw is preserved so RPC semantics are unchanged.
 */
export const trackDoOperation = async <T>(
  env: Env,
  name: string,
  fields: WideEventFields,
  run: () => Promise<T>
): Promise<T> => {
  const startedAt = Date.now();
  try {
    const result = await run();
    await Effect.runPromise(
      emitOneShotWideEvent(env, name, { ...fields, operationDurationMs: Date.now() - startedAt })
    );
    return result;
  } catch (error) {
    await Effect.runPromise(
      emitOneShotWideEvent(
        env,
        name,
        { ...fields, durationMs: Date.now() - startedAt },
        { outcome: "failure", error }
      )
    );
    throw error;
  }
};
