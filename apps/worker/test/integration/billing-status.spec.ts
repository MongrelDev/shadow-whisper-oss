import { describe, expect, it } from "vitest";
import { createAuthenticatedUser } from "../setup/auth";
import { recordUsageFor } from "../setup/user-data";
import { insertTestSubscription } from "../setup/db";
import { authedFetch, readJson, workerFetch } from "../setup/request";

interface BillingStatusResponse {
  plan: "free" | "pro";
  status: string;
  displayStatus: "free" | "active" | "canceling" | "canceled";
  trialEnd: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: number | null;
  usage: {
    spokenWords: number;
    transformedWords: number;
    totalWords: number;
    limit: number | null;
  };
}

describe("GET /billing/status", () => {
  it("requires authentication", async () => {
    const response = await workerFetch("/billing/status");

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toMatchObject({
      error_code: "er_authentication",
    });
  });

  it("returns the free-tier status for a signed-in user without subscriptions", async () => {
    const user = await createAuthenticatedUser({ email: "billing-free@example.com" });

    const response = await authedFetch("/billing/status", user.cookie);

    expect(response.status).toBe(200);

    await expect(readJson<BillingStatusResponse>(response)).resolves.toMatchObject({
      plan: "free",
      status: "free",
      displayStatus: "free",
      trialEnd: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      usage: {
        spokenWords: 0,
        transformedWords: 0,
        totalWords: 0,
        limit: 2000,
      },
    });
  });

  it("returns the latest active subscription details", async () => {
    const user = await createAuthenticatedUser({ email: "billing-pro@example.com" });
    const currentPeriodEndMs = Date.now() + 1000 * 60 * 60 * 24 * 30;

    await insertTestSubscription({
      referenceId: user.user.id,
      plan: "pro",
      status: "active",
      periodEnd: new Date(currentPeriodEndMs),
    });

    const response = await authedFetch("/billing/status", user.cookie);

    expect(response.status).toBe(200);

    await expect(readJson<BillingStatusResponse>(response)).resolves.toMatchObject({
      plan: "pro",
      status: "active",
      displayStatus: "active",
      currentPeriodEnd: Math.floor(currentPeriodEndMs / 1000),
      cancelAtPeriodEnd: false,
      canceledAt: null,
      usage: {
        spokenWords: 0,
        transformedWords: 0,
        totalWords: 0,
      },
    });
  });

  it("returns trialing status with trial end date", async () => {
    const user = await createAuthenticatedUser({ email: "billing-trialing@example.com" });
    const trialEndMs = Date.now() + 1000 * 60 * 60 * 24 * 7;
    const periodEndMs = Date.now() + 1000 * 60 * 60 * 24 * 30;

    await insertTestSubscription({
      referenceId: user.user.id,
      plan: "pro",
      status: "trialing",
      trialStart: new Date(),
      trialEnd: new Date(trialEndMs),
      periodEnd: new Date(periodEndMs),
    });

    const response = await authedFetch("/billing/status", user.cookie);
    expect(response.status).toBe(200);
    const body = await readJson<BillingStatusResponse>(response);

    expect(body.plan).toBe("pro");
    expect(body.status).toBe("trialing");
    expect(body.displayStatus).toBe("active");
    expect(body.trialEnd).toBe(Math.floor(trialEndMs / 1000));
  });

  it("returns canceling status when cancelAtPeriodEnd is true", async () => {
    const user = await createAuthenticatedUser({ email: "billing-canceling@example.com" });
    const periodEndMs = Date.now() + 1000 * 60 * 60 * 24 * 15;
    const canceledAtMs = Date.now() - 1000 * 60 * 60 * 24 * 2;

    await insertTestSubscription({
      referenceId: user.user.id,
      plan: "pro",
      status: "active",
      cancelAtPeriodEnd: true,
      canceledAt: new Date(canceledAtMs),
      periodEnd: new Date(periodEndMs),
    });

    const response = await authedFetch("/billing/status", user.cookie);
    expect(response.status).toBe(200);
    const body = await readJson<BillingStatusResponse>(response);

    expect(body.plan).toBe("pro");
    expect(body.cancelAtPeriodEnd).toBe(true);
    expect(body.displayStatus).toBe("canceling");
    expect(body.canceledAt).toBe(Math.floor(canceledAtMs / 1000));
    expect(body.currentPeriodEnd).toBe(Math.floor(periodEndMs / 1000));
  });

  it("returns canceled status for a fully canceled subscription", async () => {
    const user = await createAuthenticatedUser({ email: "billing-canceled@example.com" });
    const canceledAtMs = Date.now() - 1000 * 60 * 60 * 24 * 5;
    const endedAtMs = Date.now() - 1000 * 60 * 60 * 24 * 1;

    await insertTestSubscription({
      referenceId: user.user.id,
      plan: "pro",
      status: "canceled",
      canceledAt: new Date(canceledAtMs),
      endedAt: new Date(endedAtMs),
      periodEnd: new Date(endedAtMs),
    });

    const response = await authedFetch("/billing/status", user.cookie);
    expect(response.status).toBe(200);
    const body = await readJson<BillingStatusResponse>(response);

    expect(body.displayStatus).toBe("canceled");
    expect(body.canceledAt).toBe(Math.floor(canceledAtMs / 1000));
  });

  it("reflects usage from the usage ledger in billing status", async () => {
    const user = await createAuthenticatedUser({ email: "billing-usage@example.com" });

    await recordUsageFor(user.user.id, {
      id: crypto.randomUUID(),
      wordCount: 750,
      bundleId: null,
      siteHost: null,
      surfaceContext: "editor",
      enginesJson: JSON.stringify(["whisper"]),
      durationMs: 30000,
      createdAt: Date.now(),
      platform: "desktop",
      os: "macos",
      language: "en",
      timezone: "UTC",
    });

    const response = await authedFetch("/billing/status", user.cookie);
    expect(response.status).toBe(200);
    const body = await readJson<BillingStatusResponse>(response);

    expect(body.plan).toBe("free");
    expect(body.usage.totalWords).toBeGreaterThanOrEqual(750);
    expect(body.usage.limit).toBe(2000);
  });

  it("pro user has no word limit in billing status", async () => {
    const user = await createAuthenticatedUser({
      email: "billing-pro-unlimited@example.com",
      stripeCustomerId: "cus_pro_unlimited",
    });
    await insertTestSubscription({
      referenceId: user.user.id,
      stripeCustomerId: "cus_pro_unlimited",
      plan: "pro",
      status: "active",
    });

    const response = await authedFetch("/billing/status", user.cookie);
    expect(response.status).toBe(200);
    const body = await readJson<BillingStatusResponse>(response);

    expect(body.plan).toBe("pro");
    expect(body.usage.limit).toBeNull();
  });
});
