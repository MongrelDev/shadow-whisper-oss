import { Hono } from "hono";
import { Effect } from "effect";
import { currentUserId } from "../auth/application/current-user";
import { enforceUserRateLimit } from "../../lib/rate-limit-effect";
import { httpRateLimited, httpUnauthorized } from "../../lib/http-errors";
import { checkoutVerifyRateLimit } from "../../middleware/rate-limit";
import { runBillingHandler } from "./runtime";
import { Observability } from "../../observability/observability";
import { BillingQueries } from "./application/billing-queries";
import type { PlanInfo } from "./schemas";
import { CheckoutTokenClient } from "./checkout-token";
import { SubscriptionService } from "./application/subscription-service";
import { DEFAULT_TRIAL_DAYS } from "./trial-benefits";
import { BillingHttp, missingCheckoutTokenResponse } from "./http-errors";

interface BillingRequestCf {
  readonly country?: string;
}

const getRequestCountry = (request: Request): string =>
  (request as Request & { cf?: BillingRequestCf }).cf?.country ??
  request.headers.get("cf-ipcountry")?.toUpperCase() ??
  "US";

const PLAN_PRICES = {
  BRL: {
    free: { monthly: 0, annual: 0 },
    pro: { monthly: 1999, annual: 19900 },
    byok: { monthly: 499, annual: 4990 },
  },
  USD: {
    free: { monthly: 0, annual: 0 },
    pro: { monthly: 749, annual: 7490 },
    byok: { monthly: 199, annual: 1999 },
  },
} as const;

const makePlans = (isBrazil: boolean): PlanInfo[] => {
  const currency = isBrazil ? "BRL" : "USD";
  const prices = PLAN_PRICES[currency];

  return [
    {
      name: "free",
      availability: "active",
      monthly: { amountInCents: prices.free.monthly, currency },
      annual: { amountInCents: prices.free.annual, currency },
      featureKeys: ["weekly_words_2000", "global_shortcut", "ai_cleanup", "history_7_days"],
      wordLimit: 2000,
    },
    {
      name: "pro",
      availability: "active",
      monthly: { amountInCents: prices.pro.monthly, currency },
      annual: { amountInCents: prices.pro.annual, currency },
      featureKeys: [
        "unlimited_dictation",
        "full_ai_rewrite",
        "personal_dictionary",
        "cloud_history",
      ],
      recommended: true,
      annualSavingsInMonths: 2,
      trialDays: DEFAULT_TRIAL_DAYS,
    },
    {
      name: "byok",
      availability: "coming_soon",
      monthly: { amountInCents: prices.byok.monthly, currency },
      annual: { amountInCents: prices.byok.annual, currency },
      featureKeys: [
        "bring_your_own_key",
        "multi_provider_support",
        "unlimited_words",
        "ai_cost_on_your_account",
      ],
      annualSavingsInMonths: 2,
    },
  ];
};

const billing = new Hono<{ Bindings: Env }>()

  .get("/checkout/verify", checkoutVerifyRateLimit, (c) => {
    const http = BillingHttp(c);
    return runBillingHandler(
      c,
      Effect.gen(function* () {
        const obs = yield* Observability;
        const token = c.req.query("token");
        yield* obs.setWideEvent({
          "billing.operation": "checkout_verify",
          checkoutTokenPresent: token !== undefined,
        });
        if (!token) return missingCheckoutTokenResponse(c);

        const checkoutToken = yield* CheckoutTokenClient;
        const payload = yield* checkoutToken.verify(token);

        const subscriptions = yield* SubscriptionService;
        const status = yield* subscriptions.getStatus(payload.userId);
        const active = status.status === "active" || status.status === "trialing";

        yield* obs.setWideEvent({
          plan: status.plan,
          subscriptionStatus: status.status,
          active,
        });

        return c.json({
          active,
          plan: status.plan,
          status: status.status,
          trialEnd: status.trialEnd,
        });
      }).pipe(
        Effect.catchTags({
          InvalidCheckoutTokenError: http.invalidCheckoutToken,
          BillingDatabaseError: http.database,
        })
      ),
      "billing.checkout.verify"
    );
  })

  .get("/plans", async (c) => {
    const country = getRequestCountry(c.req.raw);
    const isBrazil = country === "BR";
    return c.json(makePlans(isBrazil));
  })

  .post("/checkout-token", (c) => {
    const unauthorized = httpUnauthorized(c);
    const rateLimited = httpRateLimited(c);

    return runBillingHandler(
      c,
      Effect.gen(function* () {
        yield* enforceUserRateLimit("billing.checkout-token", ["RATE_LIMIT_5_PER_MIN"]);
        const userId = yield* currentUserId;
        const obs = yield* Observability;
        const checkoutToken = yield* CheckoutTokenClient;
        yield* obs.setWideEvent({ "billing.operation": "checkout_token_create" });
        const token = yield* checkoutToken.create({ userId });
        yield* obs.setWideEvent({ checkoutTokenIssued: true });
        return c.json({ token });
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          RateLimitedError: rateLimited,
        })
      ),
      "billing.checkout-token.create"
    );
  })

  .get("/status", (c) => {
    const http = BillingHttp(c);
    const unauthorized = httpUnauthorized(c);

    return runBillingHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        const billing = yield* BillingQueries;
        const result = yield* billing.getStatus({ userId });
        return c.json(result);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          BillingDatabaseError: http.database,
        })
      ),
      "billing.status.get"
    );
  });

export default billing;
