import { Effect } from "effect";
import { initWideEventLogger, makeWideEvent } from "./wide-event-evlog";
import type { WideEventFields } from "./wide-event";

export interface OneShotWideEventOptions {
  /**
   * Final outcome of the operation. Defaults to "success". Pass "failure" with
   * an `error` so the event records the typed error payload instead of silently
   * reporting success after a failed operation.
   */
  readonly outcome?: "success" | "failure";
  readonly error?: unknown;
  readonly responseStatus?: number;
  /** Extra fields merged into the success/failure finalize step. */
  readonly fields?: WideEventFields;
}

/**
 * Emit a single wide event from a non-HTTP context (e.g. Workflow steps inside a
 * Durable Object). Synthesizes a Request so the underlying evlog adapter can
 * build a request-shaped envelope; the URL path identifies the originating
 * subsystem so dashboards can filter on it.
 */
export const emitOneShotWideEvent = (
  env: Env,
  name: string,
  fields: WideEventFields,
  options?: OneShotWideEventOptions
): Effect.Effect<void> =>
  Effect.suspend(() => {
    initWideEventLogger(env);
    const request = new Request(`https://internal.shadowwhisper/${name}`, { method: "POST" });
    const wideEvent = makeWideEvent({
      request,
      baseFields: { event: name, ...fields },
    });
    const finalize =
      options?.outcome === "failure"
        ? wideEvent.fail(options.error, {
            responseStatus: options.responseStatus,
            fields: options.fields,
          })
        : wideEvent.succeed({
            responseStatus: options?.responseStatus,
            fields: options?.fields,
          });
    return Effect.andThen(
      wideEvent.set({ event: name, ...fields }),
      Effect.andThen(finalize, wideEvent.emit)
    );
  });
