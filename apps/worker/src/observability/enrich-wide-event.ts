import { Effect, Option } from "effect";
import { Observability } from "./observability";
import type { WideEventFields } from "./wide-event";

/**
 * Merge fields into the request-scoped wide event when an Observability service
 * is present in context, otherwise do nothing. Uses `Effect.serviceOption` so
 * infra adapters can enrich the event without forcing `Observability` into their
 * requirement channel — keeping port contracts free of an observability
 * dependency while still folding diagnostics into the single wide event instead
 * of scattering them across `Effect.log*` lines.
 */
export const enrichWideEvent = (fields: WideEventFields): Effect.Effect<void> =>
  Effect.flatMap(Effect.serviceOption(Observability), (obs) =>
    Option.isSome(obs) ? obs.value.setWideEvent(fields) : Effect.void
  );
