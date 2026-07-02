import { describe, expect, it } from "vitest";
import { createAuthenticatedUser } from "../setup/auth";
import {
  findAffiliateProfileByUserId,
  findAffiliateReferralByReferredUserId,
  findUserByEmail,
  insertTestAffiliateProfile,
  insertTestAffiliateReferral,
  insertTestAffiliateReward,
  insertTestSubscription,
  insertTestUser,
} from "../setup/db";
import { authedFetch, readJson, workerFetch, workerJson } from "../setup/request";

interface AffiliateProfileResponse {
  code: string;
  isActive: boolean;
  createdAt: string;
  eligibility: {
    canParticipate: boolean;
    reason: "missing_stripe_customer" | "missing_active_subscription" | null;
  };
}

interface AffiliateDashboardResponse {
  profile: AffiliateProfileResponse;
  stats: {
    totalReferrals: number;
    grantedRewardDays: number;
  };
  referrals: Array<{
    referredEmail: string;
    referredName: string;
    status: string;
    rewardGranted: boolean;
  }>;
}

async function createEligibleReferrer(input: {
  email: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  code: string;
}) {
  const referrer = await createAuthenticatedUser({
    email: input.email,
    stripeCustomerId: input.stripeCustomerId,
  });

  await insertTestSubscription({
    referenceId: referrer.user.id,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    status: "active",
    plan: "pro",
  });

  const profile = await insertTestAffiliateProfile({
    userId: referrer.user.id,
    code: input.code,
    isActive: true,
  });

  return { referrer, profile };
}

// The affiliate flow is gated behind the `affiliate-flow-enabled` feature flag,
// hardcoded to disabled in src/middleware/feature-flag.ts (commit 008fc4ce2).
// All routes return 403 while the flag is off, so this suite is skipped until
// the flag is re-enabled.
describe.skip("affiliate routes", () => {
  it("rejects anonymous access to profile and dashboard", async () => {
    const profileResponse = await workerFetch("/affiliate/profile");
    const dashboardResponse = await workerFetch("/affiliate/dashboard");

    expect(profileResponse.status).toBe(401);
    expect(dashboardResponse.status).toBe(401);
    await expect(profileResponse.json()).resolves.toMatchObject({
      error_code: "er_authentication",
    });
    await expect(dashboardResponse.json()).resolves.toMatchObject({
      error_code: "er_authentication",
    });
  });

  it("returns ineligible profile when the user has no Stripe customer", async () => {
    const user = await createAuthenticatedUser({ email: "affiliate-no-stripe@example.com" });

    const response = await authedFetch("/affiliate/profile", user.cookie);

    expect(response.status).toBe(200);
    await expect(readJson<AffiliateProfileResponse>(response)).resolves.toEqual({
      code: "",
      isActive: false,
      createdAt: "",
      eligibility: {
        canParticipate: false,
        reason: "missing_stripe_customer",
      },
    });
  });

  it("creates and reuses an affiliate profile for an eligible user", async () => {
    const user = await createAuthenticatedUser({
      email: "affiliate-profile@example.com",
      stripeCustomerId: "cus_affiliate_profile",
    });

    await insertTestSubscription({
      referenceId: user.user.id,
      stripeCustomerId: "cus_affiliate_profile",
      stripeSubscriptionId: "sub_affiliate_profile",
      status: "active",
      plan: "pro",
    });

    const firstResponse = await authedFetch("/affiliate/profile", user.cookie);
    const secondResponse = await authedFetch("/affiliate/profile", user.cookie);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);

    const firstBody = await readJson<AffiliateProfileResponse>(firstResponse);
    const secondBody = await readJson<AffiliateProfileResponse>(secondResponse);

    expect(firstBody).toMatchObject({
      isActive: true,
      eligibility: { canParticipate: true, reason: null },
    });
    expect(firstBody.code).toHaveLength(8);
    expect(secondBody.code).toBe(firstBody.code);

    const storedProfile = await findAffiliateProfileByUserId(user.user.id);
    expect(storedProfile?.code).toBe(firstBody.code);
  });

  it("rejects an invalid affiliate code", async () => {
    const response = await workerJson("/affiliate/signup", {
      method: "POST",
      json: {
        name: "Invalid Invite",
        email: "invalid-invite@example.com",
        password: "correct horse battery staple",
        code: "badcode1",
      },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error_code: "er_invalid_affiliate_code",
    });

    await expect(findUserByEmail("invalid-invite@example.com")).resolves.toBeUndefined();
  });

  it("rejects self-referral without creating a new user", async () => {
    const { referrer, profile } = await createEligibleReferrer({
      email: "affiliate-self@example.com",
      stripeCustomerId: "cus_affiliate_self",
      stripeSubscriptionId: "sub_affiliate_self",
      code: "selfref1",
    });

    const response = await workerJson("/affiliate/signup", {
      method: "POST",
      json: {
        name: "Same Person",
        email: referrer.user.email,
        password: "correct horse battery staple",
        code: profile.code,
      },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error_code: "er_self_referral",
    });

    await expect(findAffiliateReferralByReferredUserId(referrer.user.id)).resolves.toBeUndefined();
  });

  it("rejects affiliate signup when the invited email already has an account", async () => {
    const { profile } = await createEligibleReferrer({
      email: "affiliate-existing-referrer@example.com",
      stripeCustomerId: "cus_affiliate_existing_referrer",
      stripeSubscriptionId: "sub_affiliate_existing_referrer",
      code: "exist123",
    });

    const existingEmail = "existing-invitee@example.com";
    const existingSignupResponse = await workerJson("/api/auth/sign-up/email", {
      method: "POST",
      json: {
        name: "Existing Invitee",
        email: existingEmail,
        password: "correct horse battery staple",
      },
    });
    expect(existingSignupResponse.ok).toBe(true);

    const existingUser = await findUserByEmail(existingEmail);

    const response = await workerJson("/affiliate/signup", {
      method: "POST",
      json: {
        name: "Existing Invitee",
        email: existingEmail,
        password: "correct horse battery staple",
        code: profile.code,
      },
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error_code: "er_email_already_exists",
    });

    await expect(findAffiliateReferralByReferredUserId(existingUser!.id)).resolves.toBeUndefined();
  });

  it("creates a referred signup and stores a pending referral", async () => {
    const { referrer, profile } = await createEligibleReferrer({
      email: "affiliate-referrer@example.com",
      stripeCustomerId: "cus_affiliate_referrer",
      stripeSubscriptionId: "sub_affiliate_referrer",
      code: "invite123",
    });

    const response = await workerJson("/affiliate/signup", {
      method: "POST",
      json: {
        name: "Invited Friend",
        email: "invited-friend@example.com",
        password: "correct horse battery staple",
        code: profile.code,
      },
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      trialDays: 30,
    });

    const createdUser = await findUserByEmail("invited-friend@example.com");
    expect(createdUser).toMatchObject({
      name: "Invited Friend",
      email: "invited-friend@example.com",
      emailVerified: false,
    });

    const referral = await findAffiliateReferralByReferredUserId(createdUser!.id);
    expect(referral).toMatchObject({
      referrerUserId: referrer.user.id,
      affiliateCode: profile.code,
      status: "pending",
      benefitType: "extended_trial",
    });
  });

  it("returns dashboard stats and referral details for an eligible affiliate", async () => {
    const referrer = await createAuthenticatedUser({
      email: "affiliate-dashboard@example.com",
      stripeCustomerId: "cus_affiliate_dashboard",
    });

    await insertTestSubscription({
      referenceId: referrer.user.id,
      stripeCustomerId: "cus_affiliate_dashboard",
      stripeSubscriptionId: "sub_affiliate_dashboard",
      status: "active",
      plan: "pro",
    });

    const profile = await insertTestAffiliateProfile({
      userId: referrer.user.id,
      code: "dashcode",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const firstReferralUser = await insertTestUser({
      email: "referral-one@example.com",
      name: "Referral One",
    });
    const secondReferralUser = await insertTestUser({
      email: "referral-two@example.com",
      name: "Referral Two",
    });

    const firstReferral = await insertTestAffiliateReferral({
      referrerUserId: referrer.user.id,
      referredUserId: firstReferralUser.id,
      affiliateCode: profile.code,
      status: "rewarded",
      rewardedAt: "2026-02-10T00:00:00.000Z",
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-10T00:00:00.000Z",
    });

    await insertTestAffiliateReward({
      referralId: firstReferral.id,
      userId: referrer.user.id,
      status: "granted",
      createdAt: "2026-02-10T00:00:00.000Z",
      updatedAt: "2026-02-10T00:00:00.000Z",
    });

    await insertTestAffiliateReferral({
      referrerUserId: referrer.user.id,
      referredUserId: secondReferralUser.id,
      affiliateCode: profile.code,
      status: "pending",
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    });

    const response = await authedFetch("/affiliate/dashboard", referrer.cookie);

    expect(response.status).toBe(200);

    await expect(readJson<AffiliateDashboardResponse>(response)).resolves.toMatchObject({
      profile: {
        code: "dashcode",
        isActive: true,
        eligibility: { canParticipate: true, reason: null },
      },
      stats: {
        totalReferrals: 2,
        grantedRewardDays: 30,
      },
      referrals: [
        {
          referredEmail: "referral-two@example.com",
          referredName: "Referral Two",
          status: "pending",
          rewardGranted: false,
        },
        {
          referredEmail: "referral-one@example.com",
          referredName: "Referral One",
          status: "rewarded",
          rewardGranted: true,
        },
      ],
    });
  });
});
