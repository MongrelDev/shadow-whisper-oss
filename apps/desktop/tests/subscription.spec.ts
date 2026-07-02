import { test, expect } from "./fixtures";

test.describe("Feature: Assinatura e Billing", () => {
  test("Scenario: buscar status de assinatura via preload bridge", async ({
    mainWindow,
    mockApi,
  }) => {
    mockApi.clearRequests();

    const status = await mainWindow.evaluate(() => window.api.user.getSubscriptionStatus());
    expect(status).toBeDefined();

    await expect
      .poll(() => mockApi.getRequests().some((r) => r.pathname === "/billing/status"), {
        timeout: 5_000,
      })
      .toBe(true);
  });

  test("Scenario: buscar planos disponíveis via preload bridge", async ({
    mainWindow,
    mockApi,
  }) => {
    mockApi.clearRequests();

    const plans = await mainWindow.evaluate(() => window.api.user.getPlans());
    expect(plans).toBeDefined();

    await expect
      .poll(() => mockApi.getRequests().some((r) => r.pathname === "/billing/plans"), {
        timeout: 5_000,
      })
      .toBe(true);
  });

  test("Scenario: exibir página de pricing com planos", async ({ mainWindow }) => {
    await mainWindow.evaluate(() => {
      window.location.hash = "#/app/pricing";
    });

    await mainWindow.waitForURL(/pricing/, { timeout: 5_000 });
    await expect(mainWindow.getByText(/pro|premium/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test("Scenario: acessar portal de billing via preload bridge", async ({
    mainWindow,
    mockApi,
  }) => {
    mockApi.clearRequests();

    const result = await mainWindow.evaluate(() => window.api.auth.subscriptionPortal());
    expect(result).toBeDefined();

    await expect
      .poll(() => mockApi.getRequests().some((r) => r.pathname.includes("subscription-portal")), {
        timeout: 5_000,
      })
      .toBe(true);
  });
});
