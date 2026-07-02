import { Context, Effect } from "effect";
import type { BillingDatabaseError } from "../../errors";
import type { CurrentSubscription, LatestSubscription } from "../../domain/subscription";

export interface SubscriptionRepositoryService {
  findCurrentByReferenceId: (
    referenceId: string
  ) => Effect.Effect<CurrentSubscription | null, BillingDatabaseError>;
  findLatestByReferenceId: (
    referenceId: string
  ) => Effect.Effect<LatestSubscription | null, BillingDatabaseError>;
}

export class SubscriptionRepository extends Context.Service<
  SubscriptionRepository,
  SubscriptionRepositoryService
>()("SubscriptionRepository") {}
