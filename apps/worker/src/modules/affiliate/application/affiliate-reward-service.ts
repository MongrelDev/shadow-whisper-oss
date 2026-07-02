import { Context, Effect, Layer } from "effect";
import { AffiliateProfileRepository } from "./ports/affiliate-profile-repository";
import { ReferralRepository } from "./ports/referral-repository";
import { RewardRepository } from "./ports/reward-repository";
import { UserReader } from "./ports/user-reader";
import { AffiliateBatchWriter } from "./ports/affiliate-batch-writer";
import { StripeRewardClient } from "./ports/stripe-reward-client";
import type { AffiliateReferral } from "../domain/affiliate-referral";
import type { AffiliateReward } from "../domain/affiliate-reward";
import { REWARD_DAYS } from "../domain/constants";
import type { IsoDateTime } from "../domain/time";
import { nowIso } from "../domain/time";
import { AffiliateDatabaseError, StripeApiError } from "../errors";

export interface InvoicePaidInput {
  readonly stripeEventId: string;
  readonly invoiceId: string;
  readonly stripeCustomerId: string;
  readonly amountPaid: number;
}

export interface SyncProfileActiveStatusInput {
  readonly stripeCustomerId: string;
  readonly subscriptionStatus: string;
}

export interface AffiliateRewardServiceShape {
  readonly processInvoicePaid: (
    input: InvoicePaidInput
  ) => Effect.Effect<void, AffiliateDatabaseError | StripeApiError>;
  readonly syncProfileActiveStatus: (
    input: SyncProfileActiveStatusInput
  ) => Effect.Effect<void, AffiliateDatabaseError>;
}

export class AffiliateRewardService extends Context.Service<
  AffiliateRewardService,
  AffiliateRewardServiceShape
>()("AffiliateRewardService") {}

// ─── Domain helpers ─────────────────────────────────────────

const toQualifiedUpdate = (invoiceId: string, now: IsoDateTime) => ({
  status: "qualified" as const,
  firstPaidInvoiceId: invoiceId,
  firstPaidAt: now,
  qualifiedAt: now,
  updatedAt: now,
});

const toRewardedUpdate = (now: IsoDateTime) => ({
  status: "rewarded" as const,
  rewardedAt: now,
  updatedAt: now,
});

const toPendingReward = (params: {
  readonly referralId: number;
  readonly referrerUserId: string;
  readonly invoiceId: string;
  readonly stripeEventId: string;
  readonly targetTrialEnd: number;
}) => ({
  referralId: params.referralId,
  userId: params.referrerUserId,
  type: "subscription_extension" as const,
  amountInCents: 0,
  currency: "",
  stripeCustomerId: null,
  stripeCreditId: null,
  stripeInvoiceId: params.invoiceId,
  stripeEventId: params.stripeEventId,
  targetTrialEnd: params.targetTrialEnd,
  status: "pending" as const,
  grantedAt: null,
  consumedAt: null,
  canceledAt: null,
  cancelReason: null,
});

const toFailedReward = (params: {
  readonly referralId: number;
  readonly referrerUserId: string;
  readonly invoiceId: string;
  readonly stripeEventId: string;
  readonly reason: string;
}) => ({
  referralId: params.referralId,
  userId: params.referrerUserId,
  type: "subscription_extension" as const,
  amountInCents: 0,
  currency: "",
  stripeCustomerId: null,
  stripeCreditId: null,
  stripeInvoiceId: params.invoiceId,
  stripeEventId: params.stripeEventId,
  targetTrialEnd: null,
  status: "failed" as const,
  grantedAt: null,
  consumedAt: null,
  canceledAt: null,
  cancelReason: params.reason,
});

const toGrantedUpdate = (now: IsoDateTime) => ({
  status: "granted" as const,
  grantedAt: now,
  updatedAt: now,
});

const shouldRetryReward = (reward: AffiliateReward): boolean =>
  reward.status === "pending" || reward.status === "failed";

const isCompletedReward = (reward: AffiliateReward | null): boolean =>
  reward !== null && !shouldRetryReward(reward);

const canProcessReferral = (params: {
  readonly status: string;
  readonly firstPaidInvoiceId: string | null;
  readonly invoiceId: string;
}): boolean =>
  params.status === "pending" ||
  (params.status === "qualified" && params.firstPaidInvoiceId === params.invoiceId);

const ELIGIBLE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

// ─── Layer ──────────────────────────────────────────────────

export const AffiliateRewardServiceLive = Layer.effect(
  AffiliateRewardService,
  Effect.gen(function* () {
    const profileRepo = yield* AffiliateProfileRepository;
    const referralRepo = yield* ReferralRepository;
    const rewardRepo = yield* RewardRepository;
    const userReader = yield* UserReader;
    const batchWriter = yield* AffiliateBatchWriter;
    const stripeReward = yield* StripeRewardClient;

    const resolveOrCreateReward = (params: {
      readonly existing: AffiliateReward | null;
      readonly referralId: number;
      readonly referrerUserId: string;
      readonly invoiceId: string;
      readonly stripeEventId: string;
      readonly targetTrialEnd: number;
    }) =>
      Effect.gen(function* () {
        if (params.existing) {
          if (params.existing.targetTrialEnd === null) {
            yield* rewardRepo.updateStatus(params.existing.id, {
              status: params.existing.status,
              targetTrialEnd: params.targetTrialEnd,
              updatedAt: nowIso(),
            });
          }
          return params.existing;
        }
        return yield* rewardRepo.create(
          toPendingReward({
            referralId: params.referralId,
            referrerUserId: params.referrerUserId,
            invoiceId: params.invoiceId,
            stripeEventId: params.stripeEventId,
            targetTrialEnd: params.targetTrialEnd,
          })
        );
      });

    const handleMissingReferrerSubscription = (params: {
      readonly existingReward: AffiliateReward | null;
      readonly referralId: number;
      readonly referrerUserId: string;
      readonly invoiceId: string;
      readonly stripeEventId: string;
    }) =>
      Effect.gen(function* () {
        const reason = "Referrer has no active subscription";
        if (params.existingReward) {
          yield* rewardRepo.updateStatus(params.existingReward.id, {
            status: "failed",
            cancelReason: reason,
            updatedAt: nowIso(),
          });
        } else {
          yield* rewardRepo.create(
            toFailedReward({
              referralId: params.referralId,
              referrerUserId: params.referrerUserId,
              invoiceId: params.invoiceId,
              stripeEventId: params.stripeEventId,
              reason,
            })
          );
        }
        yield* Effect.logWarning("Referrer has no active subscription, skipping reward");
      });

    const findProcessableReferral = (userId: string, invoiceId: string) =>
      Effect.gen(function* () {
        const pendingReferral = yield* referralRepo.findPendingByReferredUserId(userId);
        const referral = pendingReferral ?? (yield* referralRepo.findByReferredUserId(userId));
        if (!referral) return null;
        if (
          !canProcessReferral({
            status: referral.status,
            firstPaidInvoiceId: referral.firstPaidInvoiceId,
            invoiceId,
          })
        ) {
          return null;
        }

        const retryReward = yield* rewardRepo.findByReferralId(referral.id);
        if (retryReward && !shouldRetryReward(retryReward)) return null;

        return { referral, retryReward };
      });

    const findEligibleReferral = (params: {
      readonly stripeCustomerId: string;
      readonly invoiceId: string;
    }) =>
      Effect.gen(function* () {
        const userId = yield* userReader.getUserIdByStripeCustomerId(params.stripeCustomerId);
        if (!userId) return null;
        return yield* findProcessableReferral(userId, params.invoiceId);
      });

    const grantRewardToReferrer = (params: {
      readonly referral: AffiliateReferral;
      readonly existingRetryReward: AffiliateReward | null;
      readonly invoiceId: string;
      readonly stripeEventId: string;
    }) =>
      Effect.gen(function* () {
        const { stripeSubscriptionId: referrerStripeSubId } = yield* userReader.getBillingProfile(
          params.referral.referrerUserId
        );
        if (!referrerStripeSubId) {
          yield* handleMissingReferrerSubscription({
            existingReward: params.existingRetryReward,
            referralId: params.referral.id,
            referrerUserId: params.referral.referrerUserId,
            invoiceId: params.invoiceId,
            stripeEventId: params.stripeEventId,
          });
          return;
        }

        const targetTrialEnd =
          params.existingRetryReward?.targetTrialEnd ??
          (yield* stripeReward.calculateSubscriptionExtensionTarget({
            stripeSubscriptionId: referrerStripeSubId,
            daysToAdd: REWARD_DAYS,
          }));

        const reward = yield* resolveOrCreateReward({
          existing: params.existingRetryReward,
          referralId: params.referral.id,
          referrerUserId: params.referral.referrerUserId,
          invoiceId: params.invoiceId,
          stripeEventId: params.stripeEventId,
          targetTrialEnd,
        });

        yield* stripeReward.extendSubscriptionTrial({
          stripeSubscriptionId: referrerStripeSubId,
          targetTrialEnd,
          idempotencyKey: `affiliate-reward:${reward.id}:subscription-extension`,
        });

        const now = nowIso();
        yield* batchWriter.grantRewardWithReferralUpdate({
          rewardId: reward.id,
          rewardUpdate: toGrantedUpdate(now),
          referralId: params.referral.id,
          referralUpdate: toRewardedUpdate(now),
        });
      });

    return AffiliateRewardService.of({
      processInvoicePaid: (input) =>
        Effect.gen(function* () {
          const { invoiceId, stripeCustomerId, amountPaid, stripeEventId } = input;

          if (amountPaid <= 0) return;

          const existingReward = yield* rewardRepo.findByStripeEventId(stripeEventId);
          if (isCompletedReward(existingReward)) return;

          const match = yield* findEligibleReferral({ stripeCustomerId, invoiceId });
          if (!match) return;

          const { referral, retryReward } = match;
          const existingRetryReward = existingReward ?? retryReward;

          if (referral.status === "pending") {
            yield* referralRepo.updateStatus(referral.id, toQualifiedUpdate(invoiceId, nowIso()));
          }

          yield* grantRewardToReferrer({
            referral,
            existingRetryReward,
            invoiceId,
            stripeEventId,
          });
        }),

      syncProfileActiveStatus: (input) =>
        Effect.gen(function* () {
          const userId = yield* userReader.getUserIdByStripeCustomerId(input.stripeCustomerId);
          if (!userId) return;
          yield* profileRepo.updateActiveByUserId(
            userId,
            ELIGIBLE_SUBSCRIPTION_STATUSES.has(input.subscriptionStatus),
            nowIso()
          );
        }),
    });
  })
);
