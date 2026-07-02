import Groq, { APIError } from "groq-sdk";
import { REQUEST_TIMEOUT_MS } from "../../../lib/request-timeout";
import { isRetryableHttpStatus } from "../../../lib/http-retry";
import type { GatewayMetadata } from "./ai";

// Groq through the AI Gateway provider-native endpoint (BYOK): `apiKey` carries
// the Groq key (forwarded upstream) and `cf-aig-authorization` authenticates the
// gateway itself. Retries, timeouts, and engine fallback live in the Effect
// layers — the SDK is pure typed transport, so maxRetries stays 0 to keep an
// outage from multiplying billed attempts before the fallback engages.
export const makeGroqClient = (env: Env): Groq =>
  new Groq({
    apiKey: env.GROQ_API_KEY,
    baseURL: `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${env.AI_GATEWAY_ID}/groq`,
    defaultHeaders: { "cf-aig-authorization": `Bearer ${env.AI_GATEWAY_TOKEN}` },
    maxRetries: 0,
    timeout: REQUEST_TIMEOUT_MS,
  });

export const gatewayMetadataHeaders = (
  model: string,
  gatewayMetadata?: GatewayMetadata
): Record<string, string> | undefined =>
  gatewayMetadata
    ? { "cf-aig-metadata": JSON.stringify({ ...gatewayMetadata, model }) }
    : undefined;

// Only `false` fails fast in the engine fallback chains; HTTP 4xx (auth, quota,
// bad request) won't be fixed by retrying the same provider.
export const isRetryableGroqError = (error: unknown): boolean | undefined =>
  error instanceof APIError && typeof error.status === "number"
    ? isRetryableHttpStatus(error.status)
    : undefined;
