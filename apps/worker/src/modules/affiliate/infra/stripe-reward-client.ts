import type Stripe from "stripe";
import { Effect } from "effect";
import type { StripeRewardClientService } from "../application/ports/stripe-reward-client";
import { StripeApiError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";

const SECONDS_PER_DAY = 86400;

const activeTrialEnd = (sub: Stripe.Subscription, nowSeconds: number): number =>
  sub.status === "trialing" && sub.trial_end != null && sub.trial_end > nowSeconds
    ? sub.trial_end
    : 0;

export const makeStripeRewardClient = (stripeClient: Stripe): StripeRewardClientService => ({
  calculateSubscriptionExtensionTarget: ({ stripeSubscriptionId, daysToAdd }) =>
    Effect.tryPromise({
      try: async () => {
        const sub = await stripeClient.subscriptions.retrieve(stripeSubscriptionId);
        const nowSeconds = Math.floor(Date.now() / 1000);
        const currentPeriodEnd = sub.items?.data[0]?.current_period_end ?? 0;
        const base = Math.max(activeTrialEnd(sub, nowSeconds), currentPeriodEnd, nowSeconds);
        return base + daysToAdd * SECONDS_PER_DAY;
      },
      catch: (e) =>
        new StripeApiError({
          message: unknownMessage(e),
          operation: "calculateSubscriptionExtensionTarget",
        }),
    }),

  extendSubscriptionTrial: ({ stripeSubscriptionId, targetTrialEnd, idempotencyKey }) =>
    Effect.tryPromise({
      try: async () => {
        await stripeClient.subscriptions.update(
          stripeSubscriptionId,
          {
            trial_end: targetTrialEnd,
            proration_behavior: "none",
          },
          { idempotencyKey }
        );
      },
      catch: (e) =>
        new StripeApiError({
          message: unknownMessage(e),
          operation: "extendSubscriptionTrial",
        }),
    }),
});
