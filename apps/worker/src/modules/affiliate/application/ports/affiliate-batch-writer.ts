import { Context, Effect } from "effect";
import type { RewardStatus } from "../../domain/affiliate-reward";
import type { ReferralStatus } from "../../domain/affiliate-referral";
import type { IsoDateTime } from "../../domain/time";
import type { AffiliateDatabaseError } from "../../errors";

export interface AffiliateBatchWriterService {
  readonly grantRewardWithReferralUpdate: (params: {
    readonly rewardId: number;
    readonly rewardUpdate: {
      readonly status: RewardStatus;
      readonly grantedAt: IsoDateTime;
      readonly updatedAt: IsoDateTime;
    };
    readonly referralId: number;
    readonly referralUpdate: {
      readonly status: ReferralStatus;
      readonly rewardedAt: IsoDateTime;
      readonly updatedAt: IsoDateTime;
    };
  }) => Effect.Effect<void, AffiliateDatabaseError>;
}

export class AffiliateBatchWriter extends Context.Service<
  AffiliateBatchWriter,
  AffiliateBatchWriterService
>()("AffiliateBatchWriter") {}
