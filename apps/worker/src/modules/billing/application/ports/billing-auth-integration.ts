import { stripe } from "@better-auth/stripe";
import { Context } from "effect";

export interface BillingAuthIntegrationContract {
  readonly stripePlugin: ReturnType<typeof stripe>;
}

export class BillingAuthIntegration extends Context.Service<
  BillingAuthIntegration,
  BillingAuthIntegrationContract
>()("BillingAuthIntegration") {}
