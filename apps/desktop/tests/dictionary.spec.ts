import { test, expect } from "./fixtures";

test.describe("Feature: Dicionário de Palavras e Snippets", () => {
  test("Scenario: listar entradas do dicionário via página", async ({ mainWindow }) => {
    await mainWindow.evaluate(() => {
      window.location.hash = "#/app/dictionary";
    });

    await mainWindow.waitForURL(/dictionary/, { timeout: 5_000 });
    await expect(mainWindow.locator("[data-testid='dictionary-page'], h1, h2").first()).toBeVisible(
      {
        timeout: 5_000,
      }
    );
  });

  test("Scenario: buscar dicionário via preload bridge", async ({ mainWindow, mockApi }) => {
    mockApi.clearRequests();

    const result = await mainWindow.evaluate(() => window.api.dictionary.get());
    expect(result).toHaveProperty("words");
    expect(result).toHaveProperty("snippets");

    await expect
      .poll(() => mockApi.getRequests().some((r) => r.pathname === "/dictionary"), {
        timeout: 5_000,
      })
      .toBe(true);
  });

  test("Scenario: adicionar palavra via preload bridge", async ({ mainWindow, mockApi }) => {
    mockApi.clearRequests();

    await mainWindow.evaluate(() => window.api.dictionary.addWord("onomatopeia"));

    await expect
      .poll(
        () =>
          mockApi
            .getRequests()
            .some((r) => r.pathname.includes("/dictionary") && r.method === "POST"),
        { timeout: 5_000 }
      )
      .toBe(true);
  });

  test("Scenario: remover palavra via preload bridge", async ({ mainWindow, mockApi }) => {
    mockApi.clearRequests();

    await mainWindow.evaluate(() => window.api.dictionary.removeWord(1));

    await expect
      .poll(
        () =>
          mockApi
            .getRequests()
            .some((r) => r.pathname.includes("/dictionary") && r.method === "DELETE"),
        { timeout: 5_000 }
      )
      .toBe(true);
  });

  test("Scenario: dicionário vazio exibe estado vazio", async ({ mainWindow }) => {
    await mainWindow.evaluate(() => {
      window.location.hash = "#/app/dictionary";
    });

    await mainWindow.waitForURL(/dictionary/, { timeout: 5_000 });

    await mainWindow.waitForTimeout(2_000);

    const wordItems = mainWindow.locator(
      "[data-testid='word-list'] li, [data-testid='dictionary-list'] li"
    );
    const count = await wordItems.count();
    expect(count).toBe(0);
  });

  test("Scenario: erro de rede ao carregar dicionário não quebra o app", async ({ mainWindow }) => {
    await mainWindow.route("**/dictionary", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "internal_error" }),
        });
      }
      return route.fallback();
    });

    await mainWindow.evaluate(() => {
      window.location.hash = "#/app/dictionary";
    });

    await mainWindow.waitForURL(/dictionary/, { timeout: 5_000 });
    await mainWindow.waitForTimeout(2_000);

    const errorVisible = await mainWindow
      .locator("[data-testid='error-message'], [role='alert'], .error")
      .first()
      .isVisible()
      .catch(() => false);
    const wordItems = await mainWindow
      .locator("[data-testid='word-list'] li, [data-testid='dictionary-list'] li")
      .count();

    expect(errorVisible || wordItems === 0).toBe(true);

    const isAlive = await mainWindow.evaluate(() => document.readyState === "complete");
    expect(isAlive).toBe(true);
  });
});
