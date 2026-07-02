import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { Effect } from "effect";
import { EvlogError, parseError } from "evlog";
import type { AppType as ApiContractType, ErrorResponse } from "@whisper/api";
import { emitOneShotWideEvent } from "./observability/emit-one-shot-wide-event";
import authHandler from "./modules/auth/handler";
import authExtras from "./modules/auth/extras-handler";
import affiliate from "./modules/affiliate/handler";
import billing from "./modules/billing/handler";
import guest from "./modules/guest/handler";
import dictionary from "./modules/dictionary/handler";
import teach from "./modules/feedback/teach-handler";
import cleanupFeedback from "./modules/feedback/cleanup-feedback-handler";
import suggestions from "./modules/feedback/suggestions-handler";
import health from "./modules/health/handler";
import skills from "./modules/skills-catalog/handler";
import usageAnalyticsHandler from "./modules/usage/handler";
import whisperSessionHandler from "./modules/whisper-session/handler";
import { byEmail, byIp, rateLimit } from "./middleware/rate-limit";
const app = new Hono<{ Bindings: Env }>();

app.use("*", (c, next) => {
  const trusted = [c.env.APP_URL, ...(c.env.TRUSTED_ORIGINS?.split(",").filter(Boolean) ?? [])];
  const extensionId = c.env.EXTENSION_ID;
  const isDev = c.env.ENVIRONMENT === "development";
  return cors({
    origin: (origin) => {
      if (trusted.includes(origin)) return origin;
      if (origin.startsWith("chrome-extension://")) {
        if (extensionId) return origin === `chrome-extension://${extensionId}` ? origin : "";
        if (isDev) return origin;
      }
      return "";
    },
    credentials: true,
    exposeHeaders: ["set-auth-token"],
  })(c, next);
});

app.use("/api/auth/sign-in/email", rateLimit("RATE_LIMIT_5_PER_MIN", byIp("sign-in")));
app.use("/api/auth/sign-up/email", rateLimit("RATE_LIMIT_5_PER_MIN", byIp("sign-up")));
app.use(
  "/api/auth/request-password-reset",
  rateLimit("RATE_LIMIT_5_PER_MIN", byIp("password-reset")),
  rateLimit("RATE_LIMIT_1_PER_MIN", byEmail("password-reset"))
);
app.use(
  "/api/auth/send-verification-email",
  rateLimit("RATE_LIMIT_5_PER_MIN", byIp("verification")),
  rateLimit("RATE_LIMIT_1_PER_MIN", byEmail("verification"))
);
app.route("/api/auth", authHandler);

const routes = app
  .route("/health", health)
  .route("/billing", billing)
  .route("/api/guest", guest)
  .route("/dictionary", dictionary)
  .route("/skills", skills)
  .route("/api/sessions", whisperSessionHandler)
  .route("/api/usage", usageAnalyticsHandler)
  .route("/teach", teach)
  .route("/api/feedback", cleanupFeedback)
  .route("/suggestions", suggestions)
  .route("/affiliate", affiliate)
  .route("/auth", authExtras);

type ParsedError = ReturnType<typeof parseError>;

const resolveErrorStatus = (parsed: ParsedError): ContentfulStatusCode =>
  (parsed.status >= 400 && parsed.status < 600 ? parsed.status : 500) as ContentfulStatusCode;

const intentionalErrorFields = (parsed: ParsedError): Record<string, unknown> => ({
  ...(parsed.why ? { why: parsed.why } : {}),
  ...(parsed.fix ? { fix: parsed.fix } : {}),
  ...(parsed.link ? { link: parsed.link } : {}),
});

const buildErrorDetails = (parsed: ParsedError, intentional: boolean): Record<string, unknown> => ({
  message: intentional ? parsed.message : "Internal server error",
  ...(parsed.code ? { code: parsed.code } : {}),
  ...(intentional ? intentionalErrorFields(parsed) : {}),
});

app.onError((err, c) => {
  const parsed = parseError(err);
  const status = resolveErrorStatus(parsed);

  Effect.runSync(
    emitOneShotWideEvent(
      c.env,
      "http.unhandled_error",
      { method: c.req.method, path: c.req.path },
      { outcome: "failure", error: err, responseStatus: status }
    )
  );

  const details = buildErrorDetails(parsed, err instanceof EvlogError);
  const body: ErrorResponse<"er_internal"> = { error_code: "er_internal", details };
  return c.json(body, status);
});

export default app;
export type AppType = typeof routes;

const apiCompatibilityCheck: ApiContractType = routes;
void apiCompatibilityCheck;

export { WhisperAgent } from "./durable-objects/whisper-agent/WhisperAgent";
export { GuestAgent } from "./durable-objects/guest-agent";
export { TeachAnalysisWorkflow } from "./workflows/teach-analysis-workflow";
