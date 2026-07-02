import { Context, Effect } from "effect";
import type { AffiliateReward, RewardStatus } from "../../domain/affiliate-reward";
import type { IsoDateTime } from "../../domain/time";
import type { AffiliateDatabaseError } from "../../errors";

export interface RewardRepositoryService {
  readonly findByReferralId: (
    referralId: number
  ) => Effect.Effect<AffiliateReward | null, AffiliateDatabaseError>;
  readonly findByUserId: (
    userId: string,
    options?: { readonly limit?: number }
  ) => Effect.Effect<readonly AffiliateReward[], AffiliateDatabaseError>;
  readonly create: (reward: {
    readonly referralId: number;
    readonly userId: string;
    readonly type: string;
    readonly amountInCents: number;
    readonly currency: string;
    readonly stripeCustomerId: string | null;
    readonly stripeCreditId: string | null;
    readonly stripeInvoiceId: string | null;
    readonly stripeEventId: string | null;
    readonly targetTrialEnd: number | null;
    readonly status: RewardStatus;
    readonly grantedAt: IsoDateTime | null;
    readonly consumedAt: IsoDateTime | null;
    readonly canceledAt: IsoDateTime | null;
    readonly cancelReason: string | null;
  }) => Effect.Effect<AffiliateReward, AffiliateDatabaseError>;
  readonly updateStatus: (
    id: number,
    update: {
      readonly status: RewardStatus;
      readonly grantedAt?: IsoDateTime;
      readonly consumedAt?: IsoDateTime;
      readonly canceledAt?: IsoDateTime;
      readonly cancelReason?: string;
      readonly stripeCreditId?: string;
      readonly targetTrialEnd?: number;
      readonly updatedAt: IsoDateTime;
    }
  ) => Effect.Effect<void, AffiliateDatabaseError>;
  readonly findByStripeEventId: (
    stripeEventId: string
  ) => Effect.Effect<AffiliateReward | null, AffiliateDatabaseError>;
}

export class RewardRepository extends Context.Service<RewardRepository, RewardRepositoryService>()(
  "RewardRepository"
) {}
