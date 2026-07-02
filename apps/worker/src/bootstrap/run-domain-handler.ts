import { Effect, Layer } from "effect";
import type { Context } from "hono";
import { CurrentUser } from "../modules/auth/application/current-user";
import { Observability } from "../observability/observability";
import { BackgroundTasks } from "../background/background-tasks";
import { runHandler, type AppRequirements } from "./effect-runtime";

/**
 * Build a `runHandler` variant that pre-bundles a domain layer. Use one of
 * these per bounded context so handlers stop repeating `Effect.provide(...)`
 * and stay focused on request/response.
 */
export const makeDomainRunner =
  <DomainR, DomainReq = never>(
    layerFactory: (env: Env) => Layer.Layer<DomainR, never, DomainReq>
  ) =>
  <
    E extends { Bindings: Env },
    R extends DomainR | DomainReq | AppRequirements | Observability | CurrentUser | BackgroundTasks,
  >(
    c: Context<E>,
    effect: Effect.Effect<Response, unknown, R>,
    name: string
  ): Promise<Response> =>
    runHandler(
      c,
      effect.pipe(Effect.provide(layerFactory(c.env))) as Effect.Effect<
        Response,
        unknown,
        AppRequirements | Observability | CurrentUser | BackgroundTasks
      >,
      name
    );
