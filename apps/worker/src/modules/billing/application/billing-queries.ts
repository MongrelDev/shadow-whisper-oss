import { Context, Effect, Layer } from "effect";
import { Observability } from "../../../observability/observability";
import { SubscriptionService } from "./subscription-service";
import type { SubscriptionStatusResponse } from "../schemas";
import type { BillingDatabaseError } from "../errors";
import type { UnknownError } from "effect/Cause";

export interface BillingQueriesShape {
  readonly getStatus: (input: {
    userId: string;
  }) => Effect.Effect<SubscriptionStatusResponse, BillingDatabaseError | UnknownError>;
}

export class BillingQueries extends Context.Service<BillingQueries, BillingQueriesShape>()(
  "BillingQueries"
) {}

export const BillingQueriesLive = Layer.effect(
  BillingQueries,
  Effect.gen(function* () {
    const subscriptions = yield* SubscriptionService;
    const obs = yield* Observability;
    const captureError = <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
      Effect.tapError(effect, (error) => obs.failWideEvent(error));

    return BillingQueries.of({
      getStatus: Effect.fnUntraced(function* (input: { userId: string }) {
        yield* obs.setWideEvent({ "billing.operation": "status" });
        const status = yield* subscriptions.getStatus(input.userId);

        yield* obs.setWideEvent({
          plan: status.plan,
          subscriptionStatus: status.status,
          hasTrialEnd: status.trialEnd !== null,
          cancelAtPeriodEnd: status.cancelAtPeriodEnd,
        });

        return {
          plan: status.plan,
          status: status.status,
          displayStatus: status.displayStatus,
          trialEnd: status.trialEnd,
          currentPeriodEnd: status.currentPeriodEnd,
          cancelAtPeriodEnd: status.cancelAtPeriodEnd,
          canceledAt: status.canceledAt,
          usage: status.usage,
        } satisfies SubscriptionStatusResponse;
      }, captureError),
    });
  })
);
