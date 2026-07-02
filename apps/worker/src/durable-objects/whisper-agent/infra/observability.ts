import { Layer } from "effect";
import { Observability, makeObservability } from "../../../observability/observability";
import { initWideEventLogger, makeWideEvent } from "../../../observability/wide-event-evlog";
import type { WideEventFields } from "../../../observability/wide-event";

// Per-call Observability for the Durable Object. The Agents SDK has no HTTP
// request to anchor a wide event, so we synthesize one (same approach as
// emitOneShotWideEvent) and emit a single structured event with internal timings.
export const makeAgentObservabilityLayer = (env: Env, name: string, baseFields: WideEventFields) =>
  Layer.sync(Observability, () => {
    initWideEventLogger(env);
    const request = new Request(`https://internal.shadowwhisper/${name}`, { method: "POST" });
    const wideEvent = makeWideEvent({ request, baseFields: { event: name, ...baseFields } });
    return makeObservability(wideEvent);
  });
