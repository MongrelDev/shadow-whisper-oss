import { test, expect } from "./fixtures";

test.describe("Feature: Configurações do App", () => {
  test("Scenario: abrir settings na seção Appearance", async ({ mainWindow }) => {
    await mainWindow.evaluate(() => {
      window.location.hash = "#/app?settings=open&section=appearance";
    });

    await expect(mainWindow.getByText(/appearance|aparência/i).first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("Scenario: ler config via preload bridge", async ({ mainWindow }) => {
    const config = await mainWindow.evaluate(() => window.api.config.get());
    expect(config).toHaveProperty("preferences");
    expect(config).toHaveProperty("shortcuts");
    expect(config.preferences.onboardingCompleted).toBe(true);
  });

  test("Scenario: atualizar config persiste no ConfigStore", async ({ mainWindow }) => {
    await mainWindow.evaluate(() => window.api.config.set({ preferences: { theme: "dark" } }));

    const config = await mainWindow.evaluate(() => window.api.config.get());
    expect(config.preferences.theme).toBe("dark");
  });

  test("Scenario: ler atalhos via preload bridge", async ({ mainWindow }) => {
    const shortcuts = await mainWindow.evaluate(() => window.api.shortcuts.get());
    expect(shortcuts).toHaveProperty("transcription");
    expect(shortcuts.transcription).toContain("Alt");
  });

  test("Scenario: alterar atalho de gravação via config", async ({ mainWindow }) => {
    const newShortcut = "CommandOrControl+Shift+R";
    await mainWindow.evaluate(
      (shortcut) => window.api.shortcuts.set("transcription", shortcut),
      newShortcut
    );

    const shortcuts = await mainWindow.evaluate(() => window.api.shortcuts.get());
    expect(shortcuts.transcription).toBe(newShortcut);

    const config = await mainWindow.evaluate(() => window.api.config.get());
    expect(config.shortcuts.transcription).toBe(newShortcut);
  });

  test("Scenario: trocar locale via config", async ({ mainWindow }) => {
    await mainWindow.evaluate(() => window.api.config.set({ preferences: { locale: "pt-BR" } }));

    const config = await mainWindow.evaluate(() => window.api.config.get());
    expect(config.preferences.locale).toBe("pt-BR");
  });
});
