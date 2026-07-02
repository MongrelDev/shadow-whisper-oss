import {
  affiliateReferral,
  and,
  eq,
  isNotNull,
  or,
  subscription,
  type DrizzleDatabase,
} from "@whisper/db";

export const DEFAULT_TRIAL_DAYS = 15;
export const AFFILIATE_REFERRAL_TRIAL_DAYS = 30;

export type TrialBenefit = {
  readonly trialDays: number;
  readonly source: "affiliate_referral";
};

export interface TrialBenefitResolver {
  readonly resolveForCheckout: (userId: string) => Promise<TrialBenefit | null>;
}

export const makeDrizzleTrialBenefitResolver = (db: DrizzleDatabase): TrialBenefitResolver => ({
  resolveForCheckout: async (userId) => {
    const [referrals, previousTrials] = await Promise.all([
      db
        .select({ id: affiliateReferral.id })
        .from(affiliateReferral)
        .where(eq(affiliateReferral.referredUserId, userId))
        .limit(1),
      db
        .select({ id: subscription.id })
        .from(subscription)
        .where(
          and(
            eq(subscription.referenceId, userId),
            or(
              isNotNull(subscription.trialStart),
              isNotNull(subscription.trialEnd),
              eq(subscription.status, "trialing")
            )
          )
        )
        .limit(1),
    ]);

    if (!referrals[0] || previousTrials[0]) return null;

    return {
      trialDays: AFFILIATE_REFERRAL_TRIAL_DAYS,
      source: "affiliate_referral",
    };
  },
});
