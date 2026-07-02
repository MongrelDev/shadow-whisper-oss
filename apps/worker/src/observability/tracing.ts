import { Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { OtlpSerialization, OtlpTracer } from "effect/unstable/observability";

const POSTHOG_TRACES_URL = "https://us.i.posthog.com/i/v1/traces";

const PROD_SAMPLE_RATE = 0.2;

export const shouldSampleTrace = (env: Env): boolean =>
  env.ENVIRONMENT !== "production" || Math.random() < PROD_SAMPLE_RATE;

export const OtlpTracingLive = (env: Env) =>
  OtlpTracer.layer({
    url: POSTHOG_TRACES_URL,
    headers: { authorization: `Bearer ${env.POSTHOG_API_KEY}` },
    resource: {
      serviceName: "shadowwhisper-worker",
      attributes: { "deployment.environment": env.ENVIRONMENT },
    },
  }).pipe(Layer.provide(OtlpSerialization.layerJson), Layer.provide(FetchHttpClient.layer));
