import { Effect, Exit, Layer } from "effect";
import type { ErrorResponse } from "@whisper/api";
import { CurrentUser } from "../modules/auth/application/current-user";
import { AppConfig, makeAppConfig } from "./config";
import { AuthLive } from "../modules/auth/server";
import { CurrentUserLive } from "../modules/auth/infra/current-user-live";
import { BillingAuthIntegrationLive, BillingLive } from "../modules/billing/infra/live";
import { AffiliateRewardsLive } from "../modules/affiliate/infra/live";
import { EmailLive } from "../modules/email/infra/live";
import { SkillsLive } from "../modules/skills/infra/bundled-skill-repository";
import { SkillsCatalogLive } from "../modules/skills-catalog/infra/live";
import { TranscriptionLive } from "../modules/transcription/infra/live";
import { WhisperMemoryLive } from "../modules/whisper-memory/infra/live";
import { WhisperSessionLive } from "../modules/whisper-session/infra/live";
import { ActionModeLive } from "../modules/action-mode/infra/live";
import {
  NoopObservabilityLive,
  Observability,
  ObservabilityLive,
} from "../observability/observability";
import { initWideEventLogger, WideEventLive } from "../observability/wide-event-evlog";
import { BackgroundTasks, BackgroundTasksLive } from "../background/background-tasks";
import { OtlpTracingLive, shouldSampleTrace } from "../observability/tracing";
import { RateLimiter, makeCloudflareRateLimiter } from "../lib/rate-limit-effect";

export interface AppLayerOptions {
  readonly waitUntil?: (promise: Promise<unknown>) => void;
}

export const makeAppLayer = (env: Env, options?: AppLayerOptions) => {
  const emailLayer = EmailLive(env);
  const billingAuthIntegrationLayer = BillingAuthIntegrationLive(env).pipe(
    Layer.provide(AffiliateRewardsLive(env))
  );
  const authDependencies = Layer.mergeAll(emailLayer, billingAuthIntegrationLayer);
  const authLayer = AuthLive(env, { waitUntil: options?.waitUntil }).pipe(
    Layer.provide(authDependencies)
  );

  const billingLayer = BillingLive(env);
  const skillsLayer = SkillsLive();
  const skillsCatalogLayer = SkillsCatalogLive(env).pipe(Layer.provide(billingLayer));

  const whisperSessionDeps = Layer.mergeAll(billingLayer, skillsCatalogLayer, skillsLayer);
  const whisperSessionLayer = WhisperSessionLive(env).pipe(Layer.provide(whisperSessionDeps));

  const actionModeLayer = ActionModeLive(env).pipe(Layer.provide(billingLayer));

  return Layer.mergeAll(
    Layer.succeed(AppConfig, makeAppConfig(env)),
    Layer.succeed(RateLimiter, makeCloudflareRateLimiter(env)),
    billingAuthIntegrationLayer,
    emailLayer,
    authLayer,
    skillsLayer,
    skillsCatalogLayer,
    TranscriptionLive(env),
    WhisperMemoryLive(env),
    whisperSessionLayer,
    actionModeLayer,
    billingLayer
  );
};

export type AppLayer = ReturnType<typeof makeAppLayer>;
export type AppRequirements = Layer.Success<AppLayer>;

interface RequestCfMetadata {
  readonly country?: string;
  readonly colo?: string;
}

const getRequestId = (request: Request): string =>
  request.headers.get("cf-ray") ?? crypto.randomUUID();

const getRequestCfMetadata = (request: Request): RequestCfMetadata | undefined => {
  const cf = (request as Request & { cf?: RequestCfMetadata }).cf;
  if (!cf || typeof cf !== "object") return undefined;
  return cf;
};

const getRequestOrigin = (request: Request): string | undefined =>
  request.headers.get("origin") ?? request.headers.get("referer") ?? undefined;

const makeRequestLayer = <E extends { Bindings: Env }>(
  c: import("hono").Context<E>,
  handlerName: string
) => {
  initWideEventLogger(c.env);

  const request = c.req.raw;
  const requestId = getRequestId(request);
  const cf = getRequestCfMetadata(request);
  const executionCtx = (c as { executionCtx?: import("evlog/workers").WorkerExecutionContext })
    .executionCtx;

  const wideEventLayer = WideEventLive({
    request,
    executionCtx,
    requestId,
    baseFields: {
      requestId,
      route: c.req.path,
      method: request.method,
      handler: handlerName,
      origin: getRequestOrigin(request),
      cfCountry: cf?.country,
      cfColo: cf?.colo,
    },
  });

  const observabilityLayer = ObservabilityLive.pipe(Layer.provide(wideEventLayer));

  if (!executionCtx) {
    throw new Error("ExecutionContext is required to build the request layer");
  }

  const backgroundTasksLayer = BackgroundTasksLive((promise) => executionCtx.waitUntil(promise));
  const appLayer = makeAppLayer(c.env).pipe(Layer.provide(observabilityLayer));
  const currentUserLayer = CurrentUserLive(request.headers).pipe(Layer.provide(appLayer));

  return Layer.mergeAll(
    appLayer,
    currentUserLayer,
    wideEventLayer,
    observabilityLayer,
    backgroundTasksLayer,
    OtlpTracingLive(c.env)
  );
};

const instrumentHandlerEffect = <A, E, R>(
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R | Observability> =>
  Effect.flatMap(Observability, (observability) =>
    observability.ensureWideEventEmitted(effect, {
      onSuccess: (response) => {
        if (!(response instanceof Response)) return undefined;
        const fields =
          response.status >= 400
            ? { http: { status: response.status } }
            : { http: { status: response.status }, error: null };
        return response.status >= 500
          ? {
              responseStatus: response.status,
              fields: { ...fields, outcome: "failure", outcomeKind: "http_5xx" },
            }
          : response.status >= 400
            ? {
                responseStatus: response.status,
                fields: { ...fields, outcome: "client_error", outcomeKind: "http_4xx" },
              }
            : { responseStatus: response.status, fields };
      },
      onFailure: () => ({ responseStatus: 500 }),
    })
  );

export const runWithAppLayer = <A>(
  env: Env,
  effect: Effect.Effect<A, unknown, AppRequirements>,
  options?: AppLayerOptions
): Promise<A> =>
  Effect.runPromise(
    effect.pipe(
      Effect.provide(makeAppLayer(env, options).pipe(Layer.provide(NoopObservabilityLive)))
    )
  );

export const runHandler = async <E extends { Bindings: Env }>(
  c: import("hono").Context<E>,
  effect: Effect.Effect<
    Response,
    unknown,
    AppRequirements | Observability | CurrentUser | BackgroundTasks
  >,
  handlerName: string
): Promise<Response> => {
  const request = c.req.raw;
  const requestId = getRequestId(request);
  const exit = await Effect.runPromiseExit(
    instrumentHandlerEffect(effect).pipe(
      Effect.withSpan(`http.${request.method.toLowerCase()}`, {
        kind: "server",
        sampled: shouldSampleTrace(c.env),
        attributes: {
          "http.method": request.method,
          "http.route": c.req.path,
          "http.handler": handlerName,
          "http.request_id": requestId,
        },
      }),
      Effect.provide(makeRequestLayer(c, handlerName))
    )
  );

  return Exit.match(exit, {
    onSuccess: (response) => response,
    onFailure: () =>
      c.json({ error_code: "er_internal" } satisfies ErrorResponse<"er_internal">, 500),
  });
};
