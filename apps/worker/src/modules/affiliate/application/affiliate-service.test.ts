import { describe, expect, it } from "@effect/vitest";
import { Effect, Exit, Layer } from "effect";
import { AffiliateService, AffiliateServiceLive } from "./affiliate-service";
import type { AffiliateProfileRepositoryService } from "./ports/affiliate-profile-repository";
import { AffiliateProfileRepository } from "./ports/affiliate-profile-repository";
import type { ReferralRepositoryService } from "./ports/referral-repository";
import { ReferralRepository } from "./ports/referral-repository";
import type { RewardRepositoryService } from "./ports/reward-repository";
import { RewardRepository } from "./ports/reward-repository";
import type { UserReaderService } from "./ports/user-reader";
import { UserReader } from "./ports/user-reader";
import type { AuthSignupService } from "./ports/auth-signup";
import { AuthSignup } from "./ports/auth-signup";
import type { ReferralWriterService } from "./ports/referral-writer";
import { ReferralWriter } from "./ports/referral-writer";
import { NoopObservabilityLive } from "../../../observability/observability";
import type { AffiliateProfile } from "../domain/affiliate-profile";
import type { AffiliateReferral } from "../domain/affiliate-referral";

const REFERRER_ID = "user-referrer";
const INVITEE_EMAIL = "invitee@example.com";
const AFFILIATE_CODE = "abc123xyz";

const stubProfile: AffiliateProfile = {
  id: 1,
  userId: REFERRER_ID,
  code: AFFILIATE_CODE,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

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
  findByCode: () => Effect.succeed(stubProfile),
  create: (input) => Effect.succeed({ ...stubProfile, userId: input.userId, code: input.code }),
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
  create: () => Effect.die("not needed"),
  updateStatus: () => Effect.void,
  findByStripeEventId: () => Effect.succeed(null),
  ...overrides,
});

const makeAuthSignup = (overrides: Partial<AuthSignupService> = {}): AuthSignupService => ({
  signUpEmail: () => Effect.succeed({ userId: "user-new", email: INVITEE_EMAIL, name: "New User" }),
  ...overrides,
});

const makeReferralWriter = (
  overrides: Partial<ReferralWriterService> = {}
): ReferralWriterService => ({
  createReferral: () => Effect.succeed({ referral: stubReferral }),
  ...overrides,
});

function buildTestLayer(
  overrides: {
    userReader?: Partial<UserReaderService>;
    profileRepo?: Partial<AffiliateProfileRepositoryService>;
    referralRepo?: Partial<ReferralRepositoryService>;
    rewardRepo?: Partial<RewardRepositoryService>;
    authSignup?: Partial<AuthSignupService>;
    referralWriter?: Partial<ReferralWriterService>;
  } = {}
) {
  return AffiliateServiceLive.pipe(
    Layer.provide([
      NoopObservabilityLive,
      Layer.succeed(UserReader, makeUserReader(overrides.userReader)),
      Layer.succeed(AffiliateProfileRepository, makeProfileRepo(overrides.profileRepo)),
      Layer.succeed(ReferralRepository, makeReferralRepo(overrides.referralRepo)),
      Layer.succeed(RewardRepository, makeRewardRepo(overrides.rewardRepo)),
      Layer.succeed(AuthSignup, makeAuthSignup(overrides.authSignup)),
      Layer.succeed(ReferralWriter, makeReferralWriter(overrides.referralWriter)),
    ])
  );
}

const runExit = <A, E>(effect: Effect.Effect<A, E, never>) => Effect.exit(effect);

const signupInput = {
  name: "New User",
  email: INVITEE_EMAIL,
  password: "password123",
  affiliateCode: AFFILIATE_CODE,
  callbackURL: "https://shadow-whisper.com/auth/verified",
};

// ─── processSignup ──────────────────────────────────────────

describe("processSignup", () => {
  it.effect("creates user and referral for valid code", () =>
    Effect.gen(function* () {
      const layer = buildTestLayer();
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateService;
          return yield* service.processSignup(signupInput);
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      if (Exit.isSuccess(exit)) {
        expect(exit.value.userId).toBe("user-new");
        expect(exit.value.trialDays).toBe(30);
      }
    })
  );

  it.effect("passes the verification callback through account creation", () =>
    Effect.gen(function* () {
      let callbackURL: string | undefined;
      const layer = buildTestLayer({
        authSignup: {
          signUpEmail: (input) => {
            callbackURL = input.callbackURL;
            return Effect.succeed({ userId: "user-new", email: INVITEE_EMAIL, name: "New User" });
          },
        },
      });

      yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateService;
          return yield* service.processSignup(signupInput);
        }).pipe(Effect.provide(layer))
      );

      expect(callbackURL).toBe(signupInput.callbackURL);
    })
  );

  it.effect("rejects invalid affiliate code", () =>
    Effect.gen(function* () {
      const layer = buildTestLayer({
        profileRepo: { findByCode: () => Effect.succeed(null) },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateService;
          return yield* service.processSignup(signupInput);
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        expect(exit.cause.toString()).toContain("InvalidAffiliateCodeError");
      }
    })
  );

  it.effect("rejects inactive affiliate profile", () =>
    Effect.gen(function* () {
      const layer = buildTestLayer({
        profileRepo: {
          findByCode: () => Effect.succeed({ ...stubProfile, isActive: false }),
        },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateService;
          return yield* service.processSignup(signupInput);
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isFailure(exit)).toBe(true);
    })
  );

  it.effect("deactivates referrer profile when subscription is missing", () =>
    Effect.gen(function* () {
      let deactivated = false;
      const layer = buildTestLayer({
        userReader: {
          getBillingProfile: () =>
            Effect.succeed({ stripeCustomerId: "cus_123", stripeSubscriptionId: null }),
        },
        profileRepo: {
          updateActiveByUserId: () => {
            deactivated = true;
            return Effect.void;
          },
        },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateService;
          return yield* service.processSignup(signupInput);
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isFailure(exit)).toBe(true);
      expect(deactivated).toBe(true);
    })
  );

  it.effect("rejects self-referral", () =>
    Effect.gen(function* () {
      const layer = buildTestLayer({
        userReader: { getEmailByUserId: () => Effect.succeed(INVITEE_EMAIL) },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateService;
          return yield* service.processSignup(signupInput);
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        expect(exit.cause.toString()).toContain("SelfReferralError");
      }
    })
  );

  it.effect("rejects when email already has an account", () =>
    Effect.gen(function* () {
      const layer = buildTestLayer({
        userReader: { getUserIdByEmail: () => Effect.succeed("existing-user-id") },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateService;
          return yield* service.processSignup(signupInput);
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        expect(exit.cause.toString()).toContain("EmailAlreadyExistsError");
      }
    })
  );

  it.effect("returns existing referral without creating duplicate", () =>
    Effect.gen(function* () {
      const layer = buildTestLayer({
        referralRepo: { findByReferredUserId: () => Effect.succeed(stubReferral) },
        referralWriter: {
          createReferral: () => {
            throw new Error("should not create duplicate referral");
          },
        },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateService;
          return yield* service.processSignup(signupInput);
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      if (Exit.isSuccess(exit)) {
        expect(exit.value.userId).toBe("user-new");
      }
    })
  );
});

// ─── eligibility (via getOrCreateProfile) ───────────────────

describe("eligibility", () => {
  it.effect("returns ineligible when missing Stripe customer", () =>
    Effect.gen(function* () {
      const layer = buildTestLayer({
        userReader: {
          getBillingProfile: () =>
            Effect.succeed({ stripeCustomerId: null, stripeSubscriptionId: null }),
        },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateService;
          return yield* service.getOrCreateProfile({ userId: "user-1" });
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      if (Exit.isSuccess(exit)) {
        expect(exit.value.eligibility.canParticipate).toBe(false);
        expect(exit.value.eligibility.reason).toBe("missing_stripe_customer");
      }
    })
  );

  it.effect("returns ineligible when missing active subscription", () =>
    Effect.gen(function* () {
      const layer = buildTestLayer({
        userReader: {
          getBillingProfile: () =>
            Effect.succeed({ stripeCustomerId: "cus_123", stripeSubscriptionId: null }),
        },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateService;
          return yield* service.getOrCreateProfile({ userId: "user-1" });
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      if (Exit.isSuccess(exit)) {
        expect(exit.value.eligibility.canParticipate).toBe(false);
        expect(exit.value.eligibility.reason).toBe("missing_active_subscription");
      }
    })
  );

  it.effect("creates profile when eligible and none exists", () =>
    Effect.gen(function* () {
      const layer = buildTestLayer();
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateService;
          return yield* service.getOrCreateProfile({ userId: "user-1" });
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      if (Exit.isSuccess(exit)) {
        expect(exit.value.eligibility.canParticipate).toBe(true);
        expect(exit.value.code).toBeTruthy();
      }
    })
  );

  it.effect("returns existing profile without creating", () =>
    Effect.gen(function* () {
      let createCalled = false;
      const layer = buildTestLayer({
        profileRepo: {
          findByUserId: () => Effect.succeed(stubProfile),
          create: () => {
            createCalled = true;
            return Effect.succeed(stubProfile);
          },
        },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateService;
          return yield* service.getOrCreateProfile({ userId: REFERRER_ID });
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      expect(createCalled).toBe(false);
      if (Exit.isSuccess(exit)) {
        expect(exit.value.code).toBe(AFFILIATE_CODE);
      }
    })
  );
});

// ─── getDashboard ───────────────────────────────────────────

describe("getDashboard", () => {
  it.effect("returns ineligible dashboard when missing Stripe customer", () =>
    Effect.gen(function* () {
      const layer = buildTestLayer({
        userReader: {
          getBillingProfile: () =>
            Effect.succeed({ stripeCustomerId: null, stripeSubscriptionId: null }),
        },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateService;
          return yield* service.getDashboard({ userId: "user-1" });
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      if (Exit.isSuccess(exit)) {
        expect(exit.value.profile.eligibility.canParticipate).toBe(false);
        expect(exit.value.profile.eligibility.reason).toBe("missing_stripe_customer");
        expect(exit.value.referrals).toEqual([]);
      }
    })
  );

  it.effect("returns full dashboard for eligible user with profile", () =>
    Effect.gen(function* () {
      const layer = buildTestLayer({
        profileRepo: { findByUserId: () => Effect.succeed(stubProfile) },
      });
      const exit = yield* runExit(
        Effect.gen(function* () {
          const service = yield* AffiliateService;
          return yield* service.getDashboard({ userId: REFERRER_ID });
        }).pipe(Effect.provide(layer))
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      if (Exit.isSuccess(exit)) {
        expect(exit.value.profile.eligibility.canParticipate).toBe(true);
        expect(exit.value.profile.code).toBe(AFFILIATE_CODE);
      }
    })
  );
});
