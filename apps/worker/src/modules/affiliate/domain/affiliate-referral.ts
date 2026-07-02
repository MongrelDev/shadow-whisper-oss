import type { IsoDateTime } from "./time";

export type ReferralStatus = "pending" | "qualified" | "rewarded" | "rejected";
export type ReferralSource = "web_link";
export type BenefitType = "extended_trial";

export interface AffiliateReferral {
  readonly id: number;
  readonly referrerUserId: string;
  readonly referredUserId: string;
  readonly affiliateCode: string;
  readonly source: ReferralSource;
  readonly status: ReferralStatus;
  readonly benefitType: BenefitType;
  readonly benefitStartedAt: IsoDateTime | null;
  readonly benefitEndsAt: IsoDateTime | null;
  readonly firstPaidInvoiceId: string | null;
  readonly firstPaidAt: IsoDateTime | null;
  readonly qualifiedAt: IsoDateTime | null;
  readonly rewardedAt: IsoDateTime | null;
  readonly rejectedAt: IsoDateTime | null;
  readonly rejectionReason: string | null;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
}
