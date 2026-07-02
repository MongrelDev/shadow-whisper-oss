import { describe, expect, it } from "vitest";
import { createAuthenticatedUser } from "../setup/auth";
import { insertTestSubscription } from "../setup/db";
import { authedJson, readJson, workerFetch } from "../setup/request";

interface CheckoutTokenResponse {
  token: string;
}

interface CheckoutVerifyResponse {
  active: boolean;
  plan: "free" | "pro";
  status: string;
  trialEnd: number | null;
}

describe("billing checkout verification routes", () => {
  it("rejects anonymous checkout token creation", async () => {
    const response = await workerFetch("/billing/checkout-token", {
      method: "POST",
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error_code: "er_authentication",
    });
  });

  it("rejects verification without a token", async () => {
    const response = await workerFetch("/billing/checkout/verify");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error_code: "er_missing_checkout_token",
    });
  });

  it("rejects invalid checkout tokens", async () => {
    const response = await workerFetch("/billing/checkout/verify?token=not-a-real-token");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error_code: "er_invalid_checkout_token",
    });
  });

  it("returns the free plan when the user has no active subscription", async () => {
    const user = await createAuthenticatedUser({ email: "checkout-free@example.com" });
    const tokenResponse = await authedJson("/billing/checkout-token", user.cookie, {
      method: "POST",
    });
    const { token } = await readJson<CheckoutTokenResponse>(tokenResponse);

    const verifyResponse = await workerFetch(
      `/billing/checkout/verify?token=${encodeURIComponent(token)}`
    );

    expect(verifyResponse.status).toBe(200);
    await expect(readJson<CheckoutVerifyResponse>(verifyResponse)).resolves.toMatchObject({
      active: false,
      plan: "free",
      status: "free",
      trialEnd: null,
    });
  });

  it("returns the active plan when the user has an active subscription", async () => {
    const user = await createAuthenticatedUser({ email: "checkout-pro@example.com" });
    const trialEndMs = Date.now() + 1000 * 60 * 60 * 24 * 7;

    await insertTestSubscription({
      referenceId: user.user.id,
      plan: "pro",
      status: "active",
      trialEnd: new Date(trialEndMs),
    });

    const tokenResponse = await authedJson("/billing/checkout-token", user.cookie, {
      method: "POST",
    });
    const { token } = await readJson<CheckoutTokenResponse>(tokenResponse);

    const verifyResponse = await workerFetch(
      `/billing/checkout/verify?token=${encodeURIComponent(token)}`
    );

    expect(verifyResponse.status).toBe(200);
    await expect(readJson<CheckoutVerifyResponse>(verifyResponse)).resolves.toMatchObject({
      active: true,
      plan: "pro",
      status: "active",
      trialEnd: Math.floor(trialEndMs / 1000),
    });
  });
});
