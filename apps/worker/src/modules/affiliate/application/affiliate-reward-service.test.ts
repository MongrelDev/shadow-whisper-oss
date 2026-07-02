import { describe, expect, it } from "@effect/vitest";
import { Effect, Exit, Layer } from "effect";
import { AffiliateRewardService, AffiliateRewardServiceLive } from "./affiliate-reward-service";
import type { AffiliateProfileRepositoryService } from "./ports/affiliate-profile-repository";
import { AffiliateProfileRepository } from "./ports/affiliate-profile-repository";
import type { ReferralRepositoryService } from "./ports/referral-repository";
import { ReferralRepository } from "./ports/referral-repository";
import type { RewardRepositoryService } from "./ports/reward-repository";
import { RewardRepository } from "./ports/reward-repository";
import type { UserReaderService } from "./ports/user-reader";
import { UserReader } from "./ports/user-reader";
import type { AffiliateBatchWriterService } from "./ports/affiliate-batch-writer";
import { AffiliateBatchWriter } from "./ports/affiliate-batch-writer";
import type { StripeRewardClientService } from "./ports/stripe-reward-client";
import { StripeRewardClient } from "./ports/stripe-reward-client";
import type { AffiliateReferral } from "../domain/affiliate-referral";
import type { AffiliateReward } from "../domain/affiliate-reward";

const REFERRER_ID = "user-referrer";
const AFFILIATE_CODE = "abc123xyz";

const stubReferral: AffiliateReferral = {
  id: 1,
  referrerUserId: REFERRER_ID,
  referredUserId: "user-new",
  affiliateCode: AFFILIATE_CODE,
  source: "web_link",
  status: "pending",
  benefitType: "extended_trial",
  benefitStartedAt: null,
  benefitEndsAt: null,
  firstPaidInvoiceId: null,
  firstPaidAt: null,
  qualifiedAt: null,
  rewardedAt: null,
  rejectedAt: null,
  rejectionReason: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const stubReward: AffiliateReward = {
  id: 1,
  referralId: 1,
  userId: REFERRER_ID,
  type: "subscription_extension",
  amountInCents: 0,
  currency: "",
  stripeCustomerId: null,
  stripeCreditId: null,
  stripeInvoiceId: "inv_123",
  stripeEventId: "evt_123",
  targetTrialEnd: 1700000000,
  status: "pending",
  grantedAt: null,
  consumedAt: null,
  canceledAt: null,
  cancelReason: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const makeUserReader = (overrides: Partial<UserReaderService> = {}): UserReaderService => ({
  getEmailByUserId: () => Effect.succeed("referrer@example.com"),
  getUserIdByEmail: () => Effect.succeed(null),
  getBillingProfile: () =>
    Effect.succeed({ stripeCustomerId: "cus_123", stripeSubscriptionId: "sub_123" }),
  getUserIdByStripeCustomerId: () => Effect.succeed("user-new"),
  ...overrides,
});

const makeProfileRepo = (
  overrides: Partial<AffiliateProfileRepositoryService> = {}
): AffiliateProfileRepositoryService => ({
  findByUserId: () => Effect.succeed(null),
  findByCode: () => Effect.succeed(null),
  create: () => Effect.die("not needed"),
  updateActiveByUserId: () => Effect.void,
  codeExists: () => Effect.succeed(false),
  ...overrides,
});

const makeReferralRepo = (
  overrides: Partial<ReferralRepositoryService> = {}
): ReferralRepositoryService => ({
  findByReferredUserId: () => Effect.succeed(null),
  findPendingByReferredUserId: () => Effect.succeed(null),
  findByReferrerUserId: () => Effect.succeed([]),
  create: () => Effect.succeed(stubReferral),
  updateStatus: () => Effect.void,
  countByReferrerUserId: () => Effect.succeed({ total: 0, qualified: 0, rewarded: 0 }),
  findByReferrerUserIdWithDetails: () => Effect.succeed([]),
  ...overrides,
});

const makeRewardRepo = (
  overrides: Partial<RewardRepositoryService> = {}
): RewardRepositoryService => ({
  findByReferralId: () => Effect.succeed(null),
  findByUserId: () => Effect.succeed([]),
  create: (input) => Effect.succeed({ ...stubReward, ...input, id: 1 } as AffiliateReward),
  updateStatus: () => Effect.void,
  findByStripeEventId: () => Effect.succeed(null),
  ...overrides,
});

const makeStripeReward = (
  overrides: Partial<StripeRewardClientService> = {}
): StripeRewardClientService => ({
  calculateSubscriptionExtensionTarget: () => Effect.succeed(1700000000),
  extendSubscriptionTrial: () => Effect.void,
  ...overrides,
});

const makeBatchWriter = (
  overrides: Partial<AffiliateBatchWriterService> = {}
): AffiliateBatchWriterService => ({
  grantRewardWithReferralUpdate: () => Effect.void,
  ...overrides,
});

function buildTestLayer(
  overrides: {
    userReader?: Partial<UserReaderService>;
    profileRepo?: Partial<AffiliateProfileRepositoryService>;
    referralRepo?: Partial<ReferralRepositoryService>;
    rewardRepo?: Partial<RewardRepositoryService>;
    stripeReward?: Partial<StripeRewardClientService>;
    batchWriter?: Partial<AffiliateBatchWriterService>;
  } = {}
) {
  return AffiliateRewardServiceLive.pipe(
    Layer.provide([
      Layer.succeed(UserReader, makeUserReader(overrides.userReader)),
      Layer.succeed(AffiliateProfileRepository, makeProfileRepo(overrides.profileRepo)),
      Layer.succeed(ReferralRepository, makeReferralRepo(overrides.referralRepo)),
      Layer.succeed(RewardRepository, makeRewardRepo(overrides.rewardRepo)),
      Layer.succeed(AffiliateBatchWriter, makeBatchWriter(overrides.batchWriter)),
      Layer.succeed(StripeRewardClient, makeStripeReward(overrides.stripeReward)),
    ])
  );
}

const runExit = <A, E>(effect: Effect.Effect<A, E, never>) => Effect.exit(effect);

const invoiceInput = {
  stripeEventId: "evt_123",
  invoiceId: "inv_123",
  stripeCustomerId: "cus_invitee",
  amountPaid: 2900,
};

// ─── processInvoicePaid ─────────────────────────────────────

describe("processInvoicePaid", () => {
  it.effect("skips when amount is zero", () =>
    Effect.gen(function* () {
      let rewardCreated = false;
      const layer = buildTestLayer({
        rewardRepo: {
          create: () => {
            rewardCreated = true;
            return Effect.succeed(stubReward);
          },
        },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateRewardService;
          yield* service.processInvoicePaid({ ...invoiceInput, amountPaid: 0 });
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      expect(rewardCreated).toBe(false);
    })
  );

  it.effect("skips when no referral exists for payer", () =>
    Effect.gen(function* () {
      let rewardCreated = false;
      const layer = buildTestLayer({
        referralRepo: {
          findPendingByReferredUserId: () => Effect.succeed(null),
          findByReferredUserId: () => Effect.succeed(null),
        },
        rewardRepo: {
          create: () => {
            rewardCreated = true;
            return Effect.succeed(stubReward);
          },
        },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateRewardService;
          yield* service.processInvoicePaid(invoiceInput);
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      expect(rewardCreated).toBe(false);
    })
  );

  it.effect("qualifies referral and grants reward on first paid invoice", () =>
    Effect.gen(function* () {
      let referralStatusUpdated = false;
      let trialExtended = false;
      let batchGranted = false;

      const layer = buildTestLayer({
        referralRepo: {
          findPendingByReferredUserId: () => Effect.succeed(stubReferral),
          updateStatus: () => {
            referralStatusUpdated = true;
            return Effect.void;
          },
        },
        userReader: {
          getUserIdByStripeCustomerId: () => Effect.succeed("user-new"),
          getBillingProfile: () =>
            Effect.succeed({
              stripeCustomerId: "cus_referrer",
              stripeSubscriptionId: "sub_referrer",
            }),
        },
        stripeReward: {
          calculateSubscriptionExtensionTarget: () => Effect.succeed(1700000000),
          extendSubscriptionTrial: () => {
            trialExtended = true;
            return Effect.void;
          },
        },
        batchWriter: {
          grantRewardWithReferralUpdate: () => {
            batchGranted = true;
            return Effect.void;
          },
        },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateRewardService;
          yield* service.processInvoicePaid(invoiceInput);
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      expect(referralStatusUpdated).toBe(true);
      expect(trialExtended).toBe(true);
      expect(batchGranted).toBe(true);
    })
  );

  it.effect("creates failed reward when referrer has no subscription", () =>
    Effect.gen(function* () {
      let createdRewardStatus: string | null = null;

      const layer = buildTestLayer({
        referralRepo: {
          findPendingByReferredUserId: () => Effect.succeed(stubReferral),
          updateStatus: () => Effect.void,
        },
        userReader: {
          getUserIdByStripeCustomerId: () => Effect.succeed("user-new"),
          getBillingProfile: () =>
            Effect.succeed({ stripeCustomerId: "cus_referrer", stripeSubscriptionId: null }),
        },
        rewardRepo: {
          create: (input) => {
            createdRewardStatus = input.status;
            return Effect.succeed({ ...stubReward, ...input, id: 2 } as AffiliateReward);
          },
        },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateRewardService;
          yield* service.processInvoicePaid(invoiceInput);
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      expect(createdRewardStatus).toBe("failed");
    })
  );

  it.effect("is idempotent for already-granted rewards", () =>
    Effect.gen(function* () {
      let rewardCreated = false;
      const grantedReward: AffiliateReward = { ...stubReward, status: "granted" };

      const layer = buildTestLayer({
        rewardRepo: {
          findByStripeEventId: () => Effect.succeed(grantedReward),
          create: () => {
            rewardCreated = true;
            return Effect.succeed(stubReward);
          },
        },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateRewardService;
          yield* service.processInvoicePaid(invoiceInput);
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      expect(rewardCreated).toBe(false);
    })
  );
});

// ─── syncProfileActiveStatus ────────────────────────────────

describe("syncProfileActiveStatus", () => {
  it.effect("activates profile for active subscription", () =>
    Effect.gen(function* () {
      let updatedActive: boolean | null = null;
      const layer = buildTestLayer({
        profileRepo: {
          updateActiveByUserId: (_userId, isActive) => {
            updatedActive = isActive;
            return Effect.void;
          },
        },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateRewardService;
          yield* service.syncProfileActiveStatus({
            stripeCustomerId: "cus_123",
            subscriptionStatus: "active",
          });
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      expect(updatedActive).toBe(true);
    })
  );

  it.effect("deactivates profile for canceled subscription", () =>
    Effect.gen(function* () {
      let updatedActive: boolean | null = null;
      const layer = buildTestLayer({
        profileRepo: {
          updateActiveByUserId: (_userId, isActive) => {
            updatedActive = isActive;
            return Effect.void;
          },
        },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateRewardService;
          yield* service.syncProfileActiveStatus({
            stripeCustomerId: "cus_123",
            subscriptionStatus: "canceled",
          });
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      expect(updatedActive).toBe(false);
    })
  );
});
