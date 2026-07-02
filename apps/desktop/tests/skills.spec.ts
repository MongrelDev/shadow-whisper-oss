import { test, expect } from "./fixtures";

test.describe("Feature: Gerenciamento e Execução de Skills", () => {
  test("Scenario: listar skills instaladas", async ({ mainWindow }) => {
    await mainWindow.evaluate(() => {
      window.location.hash = "#/app/skills";
    });

    await expect(mainWindow.getByText("Corrigir gramática")).toBeVisible({ timeout: 5_000 });
  });

  test("Scenario: abrir modal de criação de skill", async ({ mainWindow }) => {
    await mainWindow.evaluate(() => {
      window.location.hash = "#/app/skills";
    });

    await mainWindow.waitForURL(/skills/, { timeout: 5_000 });

    const createButton = mainWindow
      .getByRole("button", { name: /create|criar|new|nova|add/i })
      .first();
    await expect(createButton).toBeVisible({ timeout: 5_000 });
    await createButton.click();

    await expect(
      mainWindow.locator("[data-testid='skill-builder'], [role='dialog']").first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("Scenario: vincular atalho de teclado a uma skill", async ({ mainWindow }) => {
    const shortcut = "CommandOrControl+Shift+G";
    await mainWindow.evaluate(
      ({ shortcut }) => window.api.skills.setShortcut("fix-grammar", shortcut),
      { shortcut }
    );

    const config = await mainWindow.evaluate(() => window.api.config.get());
    expect(config.skills.shortcuts["fix-grammar"]).toBe(shortcut);
  });

  test("Scenario: preview de execução no skill builder", async ({ mainWindow, mockApi }) => {
    mockApi.clearRequests();

    await mainWindow.evaluate(async () => {
      return window.api.skillBuilder.previewExecute({
        body: "Correct grammar",
        inputText: "texto com erro",
      });
    });

    await expect
      .poll(() => mockApi.getRequests().some((r) => r.pathname === "/skills/preview-execute"), {
        timeout: 5_000,
      })
      .toBe(true);
  });
});
