import { test, expect } from "./fixtures";

test.describe("Feature: Dashboard de Afiliados", () => {
  test("Scenario: exibir página de afiliados", async ({ mainWindow }) => {
    await mainWindow.evaluate(() => {
      window.location.hash = "#/app/affiliate";
    });

    await mainWindow.waitForURL(/affiliate/, { timeout: 5_000 });
    await expect(mainWindow.locator("[data-testid='affiliate-page'], h1, h2").first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("Scenario: buscar perfil de afiliado via preload bridge", async ({
    mainWindow,
    mockApi,
  }) => {
    mockApi.clearRequests();

    const result = await mainWindow.evaluate(() => window.api.affiliate.getProfile());
    expect(result).toBeDefined();
    expect(result).toHaveProperty("referralCode");

    await expect
      .poll(() => mockApi.getRequests().some((r) => r.pathname.includes("affiliate")), {
        timeout: 5_000,
      })
      .toBe(true);
  });

  test("Scenario: buscar dashboard de afiliado via preload bridge", async ({
    mainWindow,
    mockApi,
  }) => {
    mockApi.clearRequests();

    const result = await mainWindow.evaluate(() => window.api.affiliate.getDashboard());
    expect(result).toBeDefined();
    expect(result).toHaveProperty("totalReferrals");

    await expect
      .poll(() => mockApi.getRequests().some((r) => r.pathname.includes("affiliate")), {
        timeout: 5_000,
      })
      .toBe(true);
  });
});
