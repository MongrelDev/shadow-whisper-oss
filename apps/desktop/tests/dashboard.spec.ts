import { test, expect } from "./fixtures";

test.describe("Feature: Dashboard (Tela Inicial)", () => {
  test("Scenario: dashboard carrega após autenticação", async ({ mainWindow }) => {
    await mainWindow.waitForURL(/app/, { timeout: 10_000 });

    await expect(
      mainWindow.locator("[data-testid='home-page'], [data-testid='dashboard']").first()
    ).toBeVisible({
      timeout: 5_000,
    });
  });

  test("Scenario: chamadas de API de usage e billing são feitas", async ({
    mainWindow,
    mockApi,
  }) => {
    await mainWindow.waitForURL(/app/, { timeout: 10_000 });

    await expect
      .poll(() => mockApi.getRequests().some((r) => r.pathname === "/api/usage/stats"), {
        timeout: 5_000,
      })
      .toBe(true);
  });

  test("Scenario: banner de upgrade para usuário free", async ({ mainWindow, mockApi }) => {
    mockApi.setSubscriptionPlan("free");
    await mainWindow.waitForURL(/app/, { timeout: 10_000 });

    const upgradeElement = mainWindow.getByText(/upgrade|pro|premium/i).first();
    await expect(upgradeElement).toBeVisible({ timeout: 5_000 });
  });

  test("Scenario: sem banner de upgrade para usuário pro", async ({ mainWindow, mockApi }) => {
    mockApi.setSubscriptionPlan("pro");

    await mainWindow.evaluate(() => {
      window.location.hash = "#/app";
      window.location.reload();
    });
    await mainWindow.waitForLoadState("domcontentloaded");
    await mainWindow.waitForURL(/app/, { timeout: 10_000 });
    await mainWindow.waitForTimeout(2_000);

    const upgradeElements = mainWindow.locator(
      "[data-testid='upgrade-banner'], [data-testid='upgrade-cta']"
    );
    await expect(upgradeElements).toHaveCount(0);
  });
});
