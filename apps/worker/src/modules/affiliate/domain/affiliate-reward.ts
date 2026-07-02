import type { IsoDateTime } from "./time";

export type RewardType = "subscription_extension";
export type RewardStatus = "pending" | "granted" | "consumed" | "canceled" | "failed";

export interface AffiliateReward {
  readonly id: number;
  readonly referralId: number;
  readonly userId: string;
  readonly type: RewardType;
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
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
}
