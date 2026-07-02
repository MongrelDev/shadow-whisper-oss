import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";
import { Cause, Effect, Exit } from "effect";
import { createDb } from "@whisper/db";
import type { AffiliateRewardServiceShape } from "../../affiliate/application/affiliate-reward-service";
import type { BillingAuthIntegrationContract } from "../application/ports/billing-auth-integration";
import { DEFAULT_TRIAL_DAYS, makeDrizzleTrialBenefitResolver } from "../trial-benefits";
import { StripeWebhookProcessingError } from "../errors";
import { emitOneShotWideEvent } from "../../../observability/emit-one-shot-wide-event";

function normalizeStripeMetadata(metadata: Record<string, unknown> | undefined) {
  if (!metadata) return {};

  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value != null)
      .map(([key, value]) => [key, String(value)])
  );
}

async function processInvoicePaidEvent(
  env: Env,
  affiliateRewards: AffiliateRewardServiceShape,
  event: Parameters<NonNullable<Parameters<typeof stripe>[0]["onEvent"]>>[0]
) {
  const invoice = event.data.object as Stripe.Invoice;
  const exit = await Effect.runPromiseExit(
    affiliateRewards.processInvoicePaid({
      stripeEventId: event.id,
      invoiceId: invoice.id,
      stripeCustomerId: String(invoice.customer),
      amountPaid: invoice.amount_paid,
    })
  );

  Exit.match(exit, {
    onSuccess: () => {},
    onFailure: (cause) => {
      // Throw so Stripe retries the webhook. The wide event carries the
      // structured cause, so we do not also log it separately.
      const error = new StripeWebhookProcessingError({
        message: "affiliate invoice.paid processing failed",
        internal: { eventType: event.type, stripeEventId: event.id, cause: Cause.pretty(cause) },
      });
      Effect.runSync(
        emitOneShotWideEvent(
          env,
          "billing.affiliate_invoice_paid",
          { stripe_event_id: event.id, event_type: event.type },
          { outcome: "failure", error }
        )
      );
      throw error;
    },
  });
}

async function syncAffiliateProfileStatus(
  env: Env,
  affiliateRewards: AffiliateRewardServiceShape,
  event: Parameters<NonNullable<Parameters<typeof stripe>[0]["onEvent"]>>[0]
) {
  const subscription = event.data.object as Stripe.Subscription;
  const exit = await Effect.runPromiseExit(
    affiliateRewards.syncProfileActiveStatus({
      stripeCustomerId: String(subscription.customer),
      subscriptionStatus: subscription.status,
    })
  );

  Exit.match(exit, {
    onSuccess: () => {},
    onFailure: (cause) => {
      const error = new StripeWebhookProcessingError({
        message: "affiliate subscription status sync failed",
        internal: { eventType: event.type, stripeEventId: event.id, cause: Cause.pretty(cause) },
      });
      Effect.runSync(
        emitOneShotWideEvent(
          env,
          "billing.affiliate_subscription_sync",
          { stripe_event_id: event.id, event_type: event.type },
          { outcome: "failure", error }
        )
      );
      throw error;
    },
  });
}

export function makeBillingAuthIntegration(
  env: Env,
  affiliateRewards: AffiliateRewardServiceShape
): BillingAuthIntegrationContract {
  const trialBenefits = makeDrizzleTrialBenefitResolver(createDb(env.DB));

  return {
    stripePlugin: stripe({
      stripeClient: new Stripe(env.STRIPE_SECRET_KEY),
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
      createCustomerOnSignUp: true,
      onEvent: async (event) => {
        if (event.type === "invoice.paid") {
          await processInvoicePaidEvent(env, affiliateRewards, event);
        }

        if (
          event.type === "customer.subscription.created" ||
          event.type === "customer.subscription.updated" ||
          event.type === "customer.subscription.deleted"
        ) {
          await syncAffiliateProfileStatus(env, affiliateRewards, event);
        }
      },
      subscription: {
        enabled: true,
        plans: [
          {
            name: "pro",
            priceId: env.STRIPE_PRO_MONTHLY,
            annualDiscountPriceId: env.STRIPE_PRO_ANNUAL,
            freeTrial: { days: DEFAULT_TRIAL_DAYS },
          },
        ],
        getCheckoutSessionParams: async ({ user, subscription }, _req, ctx) => {
          const benefit = await trialBenefits.resolveForCheckout(user.id);
          if (!benefit) return {};

          const body = ctx.body as { metadata?: Record<string, unknown> };

          return {
            params: {
              subscription_data: {
                trial_period_days: benefit.trialDays,
                metadata: {
                  ...normalizeStripeMetadata(body.metadata),
                  userId: user.id,
                  subscriptionId: subscription.id,
                  referenceId: user.id,
                  trialBenefitSource: benefit.source,
                },
              },
            },
          };
        },
      },
    }),
  };
}
