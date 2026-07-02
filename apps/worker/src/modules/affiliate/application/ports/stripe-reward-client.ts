import { Context, Effect } from "effect";
import type { StripeApiError } from "../../errors";

export interface StripeRewardClientService {
  readonly calculateSubscriptionExtensionTarget: (params: {
    readonly stripeSubscriptionId: string;
    readonly daysToAdd: number;
  }) => Effect.Effect<number, StripeApiError>;
  readonly extendSubscriptionTrial: (params: {
    readonly stripeSubscriptionId: string;
    readonly targetTrialEnd: number;
    readonly idempotencyKey: string;
  }) => Effect.Effect<void, StripeApiError>;
}

export class StripeRewardClient extends Context.Service<
  StripeRewardClient,
  StripeRewardClientService
>()("StripeRewardClient") {}
