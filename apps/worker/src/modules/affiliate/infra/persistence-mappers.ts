import { Schema } from "effect";
import type { AffiliateReferral } from "../domain/affiliate-referral";
import type { IsoDateTime } from "../domain/time";
import { nowIso } from "../domain/time";

const NullableString = Schema.NullOr(Schema.String);

const AffiliateProfileFromRow = Schema.Struct({
  id: Schema.Number,
  userId: Schema.String,
  code: Schema.String,
  isActive: Schema.Boolean,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export const decodeAffiliateProfile = Schema.decodeUnknownSync(AffiliateProfileFromRow);

const AffiliateReferralFromRow = Schema.Struct({
  id: Schema.Number,
  referrerUserId: Schema.String,
  referredUserId: Schema.String,
  affiliateCode: Schema.String,
  source: Schema.Literal("web_link"),
  status: Schema.Literals(["pending", "qualified", "rewarded", "rejected"]),
  benefitType: Schema.Literal("extended_trial"),
  benefitStartedAt: NullableString,
  benefitEndsAt: NullableString,
  firstPaidInvoiceId: NullableString,
  firstPaidAt: NullableString,
  qualifiedAt: NullableString,
  rewardedAt: NullableString,
  rejectedAt: NullableString,
  rejectionReason: NullableString,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export const decodeAffiliateReferral = Schema.decodeUnknownSync(AffiliateReferralFromRow);

export interface AffiliateReferralPersistenceInput {
  readonly referrerUserId: string;
  readonly referredUserId: string;
  readonly affiliateCode: string;
  readonly source: AffiliateReferral["source"];
  readonly status: AffiliateReferral["status"];
  readonly benefitType: AffiliateReferral["benefitType"];
  readonly benefitStartedAt: IsoDateTime | null;
  readonly benefitEndsAt: IsoDateTime | null;
  readonly firstPaidInvoiceId?: string | null;
  readonly firstPaidAt?: IsoDateTime | null;
  readonly qualifiedAt?: IsoDateTime | null;
  readonly rewardedAt?: IsoDateTime | null;
  readonly rejectedAt?: IsoDateTime | null;
  readonly rejectionReason?: string | null;
}

const orNull = <T>(value: T | undefined | null): T | null => value ?? null;

export const affiliateReferralToInsert = (referral: AffiliateReferralPersistenceInput) => {
  const now = nowIso();
  return {
    referrerUserId: referral.referrerUserId,
    referredUserId: referral.referredUserId,
    affiliateCode: referral.affiliateCode,
    source: referral.source,
    status: referral.status,
    benefitType: referral.benefitType,
    benefitStartedAt: referral.benefitStartedAt,
    benefitEndsAt: referral.benefitEndsAt,
    firstPaidInvoiceId: orNull(referral.firstPaidInvoiceId),
    firstPaidAt: orNull(referral.firstPaidAt),
    qualifiedAt: orNull(referral.qualifiedAt),
    rewardedAt: orNull(referral.rewardedAt),
    rejectedAt: orNull(referral.rejectedAt),
    rejectionReason: orNull(referral.rejectionReason),
    createdAt: now,
    updatedAt: now,
  };
};

const AffiliateRewardFromRow = Schema.Struct({
  id: Schema.Number,
  referralId: Schema.Number,
  userId: Schema.String,
  type: Schema.Literal("subscription_extension"),
  amountInCents: Schema.Number,
  currency: Schema.String,
  stripeCustomerId: NullableString,
  stripeCreditId: NullableString,
  stripeInvoiceId: NullableString,
  stripeEventId: NullableString,
  targetTrialEnd: Schema.NullOr(Schema.Number),
  status: Schema.Literals(["pending", "granted", "consumed", "canceled", "failed"]),
  grantedAt: NullableString,
  consumedAt: NullableString,
  canceledAt: NullableString,
  cancelReason: NullableString,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export const decodeAffiliateReward = Schema.decodeUnknownSync(AffiliateRewardFromRow);
