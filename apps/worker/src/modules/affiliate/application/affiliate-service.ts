import { Context, Effect, Layer, Schedule } from "effect";
import { Observability, captureErrorWith } from "../../../observability/observability";
import { AffiliateProfileRepository } from "./ports/affiliate-profile-repository";
import { ReferralRepository } from "./ports/referral-repository";
import type { ReferralWithDetails } from "./ports/referral-repository";
import { RewardRepository } from "./ports/reward-repository";
import { UserReader } from "./ports/user-reader";
import { AuthSignup } from "./ports/auth-signup";
import { ReferralWriter } from "./ports/referral-writer";
import type { AffiliateProfile } from "../domain/affiliate-profile";
import type { RewardStatus } from "../domain/affiliate-reward";
import { REWARD_DAYS } from "../domain/constants";
import { nowIso } from "../domain/time";
import { AFFILIATE_CODE_LENGTH } from "../schemas";
import {
  CodeGenerationError,
  AffiliateDatabaseError,
  DuplicateReferralError,
  EmailAlreadyExistsError,
  DisposableEmailError,
  InvalidAffiliateCodeError,
  SelfReferralError,
  SignupError,
} from "../errors";

type AffiliateEligibility =
  | { readonly canParticipate: true; readonly reason: null }
  | {
      readonly canParticipate: false;
      readonly reason: "missing_stripe_customer" | "missing_active_subscription";
    };

export interface AffiliateDashboard {
  readonly profile: {
    readonly code: string;
    readonly isActive: boolean;
    readonly createdAt: string;
    readonly eligibility: AffiliateEligibility;
  };
  readonly stats: {
    readonly totalReferrals: number;
    readonly grantedRewardDays: number;
  };
  readonly referrals: ReadonlyArray<ReferralWithDetails>;
}

export interface AffiliateProfileDto {
  readonly code: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly eligibility: AffiliateEligibility;
}

export interface SignupInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly affiliateCode: string;
  readonly callbackURL?: string;
}

export interface SignupOutput {
  readonly userId: string;
  readonly trialDays: number;
}

export interface AffiliateServiceShape {
  readonly getDashboard: (input: {
    userId: string;
  }) => Effect.Effect<AffiliateDashboard, AffiliateDatabaseError>;
  readonly getOrCreateProfile: (input: {
    userId: string;
  }) => Effect.Effect<AffiliateProfileDto, AffiliateDatabaseError | CodeGenerationError>;
  readonly processSignup: (
    input: SignupInput
  ) => Effect.Effect<
    SignupOutput,
    | AffiliateDatabaseError
    | DisposableEmailError
    | DuplicateReferralError
    | InvalidAffiliateCodeError
    | SelfReferralError
    | EmailAlreadyExistsError
    | SignupError
  >;
}

export class AffiliateService extends Context.Service<AffiliateService, AffiliateServiceShape>()(
  "AffiliateService"
) {}

const toProfileDto = (profile: AffiliateProfile): AffiliateProfileDto => ({
  code: profile.code,
  isActive: profile.isActive,
  createdAt: profile.createdAt,
  eligibility: { canParticipate: true, reason: null },
});

const ineligibleProfileDto = (
  reason: Exclude<AffiliateEligibility["reason"], null>
): AffiliateProfileDto => ({
  code: "",
  isActive: false,
  createdAt: "",
  eligibility: { canParticipate: false, reason },
});

const DEFAULT_LIST_LIMIT = 100;

const EMPTY_DASHBOARD: AffiliateDashboard = {
  profile: {
    code: "",
    isActive: false,
    createdAt: "",
    eligibility: { canParticipate: true, reason: null },
  },
  stats: { totalReferrals: 0, grantedRewardDays: 0 },
  referrals: [],
};

const generateCode = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36))
    .join("")
    .slice(0, AFFILIATE_CODE_LENGTH)
    .toLowerCase();
};

const MAX_CODE_RETRIES = 5;
const AFFILIATE_TRIAL_DAYS = 30;
const retryPolicy = Schedule.exponential("100 millis").pipe(Schedule.take(3));

function resolveInviteeEmail(email: string): string {
  return email.toLowerCase();
}

export const AffiliateServiceLive = Layer.effect(
  AffiliateService,
  Effect.gen(function* () {
    const obs = yield* Observability;
    const profileRepo = yield* AffiliateProfileRepository;
    const referralRepo = yield* ReferralRepository;
    const rewardRepo = yield* RewardRepository;
    const userReader = yield* UserReader;
    const authSignup = yield* AuthSignup;
    const referralWriter = yield* ReferralWriter;

    const captureError = captureErrorWith(obs);

    const checkEligibility = Effect.fnUntraced(function* (userId: string) {
      const billing = yield* userReader.getBillingProfile(userId);
      if (!billing.stripeCustomerId) {
        yield* obs.setWideEvent({ eligibilityReason: "missing_stripe_customer" });
        return { canParticipate: false as const, reason: "missing_stripe_customer" as const };
      }
      if (!billing.stripeSubscriptionId) {
        yield* obs.setWideEvent({ eligibilityReason: "missing_active_subscription" });
        return { canParticipate: false as const, reason: "missing_active_subscription" as const };
      }
      return { canParticipate: true as const, reason: null };
    });

    const generateUniqueCode = Effect.gen(function* () {
      const code = generateCode();
      const exists = yield* profileRepo.codeExists(code);
      if (!exists) return code;
      return yield* new CodeGenerationError({ message: "Generated code already exists" });
    }).pipe(
      Effect.retry({
        times: MAX_CODE_RETRIES - 1,
        while: (error) => error._tag === "CodeGenerationError",
      }),
      Effect.catchTag("CodeGenerationError", () =>
        Effect.fail(
          new CodeGenerationError({
            message: `Failed to generate unique code after ${MAX_CODE_RETRIES} attempts`,
          })
        )
      )
    );

    const ensureActiveAffiliateProfile = Effect.fnUntraced(function* (input: SignupInput) {
      const profile = yield* profileRepo.findByCode(input.affiliateCode);
      if (!profile || !profile.isActive) {
        return yield* new InvalidAffiliateCodeError({ code: input.affiliateCode });
      }

      const { stripeSubscriptionId } = yield* userReader.getBillingProfile(profile.userId);
      if (!stripeSubscriptionId) {
        yield* profileRepo.updateActiveByUserId(profile.userId, false, nowIso());
        return yield* new InvalidAffiliateCodeError({ code: input.affiliateCode });
      }

      return profile;
    });

    const ensureNotSelfReferral = Effect.fnUntraced(function* (
      referrerUserId: string,
      inviteeEmail: string
    ) {
      const referrerEmail = yield* userReader.getEmailByUserId(referrerUserId);
      if (referrerEmail && referrerEmail.toLowerCase() === inviteeEmail) {
        return yield* new SelfReferralError({ userId: referrerUserId });
      }
    });

    const ensureNoExistingUser = Effect.fnUntraced(function* (email: string) {
      const existingUserId = yield* userReader.getUserIdByEmail(email);
      if (existingUserId) {
        return yield* new EmailAlreadyExistsError({ email });
      }
    });

    return AffiliateService.of({
      getDashboard: Effect.fnUntraced(function* ({ userId }: { userId: string }) {
        yield* obs.setWideEvent({ "affiliate.operation": "dashboard" });

        const eligibility = yield* checkEligibility(userId);
        if (!eligibility.canParticipate) {
          return {
            ...EMPTY_DASHBOARD,
            profile: { ...EMPTY_DASHBOARD.profile, eligibility },
          } satisfies AffiliateDashboard;
        }

        const profile = yield* profileRepo.findByUserId(userId);
        if (!profile) {
          yield* obs.setWideEvent({ profileExists: false });
          return EMPTY_DASHBOARD;
        }

        yield* obs.setWideEvent({ profileExists: true, affiliateCodePresent: true });

        const [referrals, rewards] = yield* Effect.all(
          [
            referralRepo.findByReferrerUserIdWithDetails(userId, { limit: DEFAULT_LIST_LIMIT }),
            rewardRepo.findByUserId(userId, { limit: DEFAULT_LIST_LIMIT }),
          ],
          { concurrency: "unbounded" }
        );

        const grantedStatuses = new Set<RewardStatus>(["granted", "consumed"]);
        const grantedRewardDays =
          rewards.filter((r) => grantedStatuses.has(r.status)).length * REWARD_DAYS;

        yield* obs.setWideEvent({
          totalReferrals: referrals.length,
          rewardCount: rewards.length,
          grantedRewardDays,
        });

        return {
          profile: toProfileDto(profile),
          stats: {
            totalReferrals: referrals.length,
            grantedRewardDays,
          },
          referrals,
        } satisfies AffiliateDashboard;
      }, captureError),

      getOrCreateProfile: Effect.fnUntraced(function* ({ userId }: { userId: string }) {
        yield* obs.setWideEvent({ "affiliate.operation": "profile" });

        const eligibility = yield* checkEligibility(userId);
        if (!eligibility.canParticipate) {
          return ineligibleProfileDto(eligibility.reason);
        }

        const existing = yield* profileRepo.findByUserId(userId);
        if (existing) {
          yield* obs.setWideEvent({ profileExists: true, affiliateCodePresent: true });
          return toProfileDto(existing);
        }

        const code = yield* generateUniqueCode;
        const profile = yield* profileRepo.create({ userId, code, isActive: true });
        yield* obs.setWideEvent({
          profileExists: false,
          profileCreated: true,
          affiliateCodePresent: true,
        });
        return toProfileDto(profile);
      }, captureError),

      processSignup: Effect.fnUntraced(function* (input: SignupInput) {
        const inviteeEmail = resolveInviteeEmail(input.email);

        yield* obs.setWideEvent({
          "affiliate.operation": "signup",
          referralCodePresent: input.affiliateCode.length > 0,
        });

        const profile = yield* ensureActiveAffiliateProfile(input).pipe(
          Effect.tapError((error) =>
            error._tag === "InvalidAffiliateCodeError"
              ? obs.setWideEvent({ denyReason: "invalid_affiliate_code" })
              : Effect.void
          )
        );

        yield* obs.setWideEvent({ referrerUserId: profile.userId });

        yield* ensureNotSelfReferral(profile.userId, inviteeEmail).pipe(
          Effect.tapError((error) =>
            error._tag === "SelfReferralError"
              ? obs.setWideEvent({ denyReason: "self_referral" })
              : Effect.void
          )
        );

        yield* ensureNoExistingUser(inviteeEmail).pipe(
          Effect.tapError((error) =>
            error._tag === "EmailAlreadyExistsError"
              ? obs.setWideEvent({ denyReason: "email_already_exists" })
              : Effect.void
          )
        );

        const userId = yield* authSignup
          .signUpEmail({
            name: input.name,
            email: input.email,
            password: input.password,
            callbackURL: input.callbackURL,
          })
          .pipe(Effect.map((result) => result.userId));

        const existingReferral = yield* referralRepo.findByReferredUserId(userId);
        if (existingReferral) {
          yield* obs.setWideEvent({
            createdUserId: userId,
            referralAlreadyExists: true,
            trialDays: AFFILIATE_TRIAL_DAYS,
          });
          return { userId, trialDays: AFFILIATE_TRIAL_DAYS } satisfies SignupOutput;
        }

        yield* referralWriter
          .createReferral({
            referral: {
              referrerUserId: profile.userId,
              referredUserId: userId,
              affiliateCode: input.affiliateCode,
              source: "web_link",
              status: "pending",
              benefitType: "extended_trial",
              benefitStartedAt: null,
              benefitEndsAt: null,
            },
          })
          .pipe(
            Effect.retry({
              schedule: retryPolicy,
              while: (e) => e._tag === "AffiliateDatabaseError",
            })
          );

        yield* obs.setWideEvent({
          createdUserId: userId,
          referralCreated: true,
          trialDays: AFFILIATE_TRIAL_DAYS,
        });

        return { userId, trialDays: AFFILIATE_TRIAL_DAYS } satisfies SignupOutput;
      }, captureError),
    });
  })
);
