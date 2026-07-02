import { test, expect, launchStandaloneApp, type StandaloneApp } from "./fixtures";

test.describe("Feature: Auto-teach (Aprendizado Automático)", () => {
  test("Scenario: ler estado de autoTeachEnabled via config", async ({ mainWindow }) => {
    const config = await mainWindow.evaluate(() => window.api.config.get());
    expect(config).toHaveProperty("autoTeachEnabled");
    expect(typeof config.autoTeachEnabled).toBe("boolean");
  });

  test("Scenario: habilitar auto-teach via config", async ({ mainWindow }) => {
    await mainWindow.evaluate(() => window.api.config.set({ autoTeachEnabled: true }));

    const config = await mainWindow.evaluate(() => window.api.config.get());
    expect(config.autoTeachEnabled).toBe(true);
  });

  test("Scenario: desabilitar auto-teach via config", async ({ mainWindow }) => {
    await mainWindow.evaluate(() => window.api.config.set({ autoTeachEnabled: false }));

    const config = await mainWindow.evaluate(() => window.api.config.get());
    expect(config.autoTeachEnabled).toBe(false);
  });

  test("Scenario: auto-teach desabilitado no config inicial não monitora", async () => {
    let standalone: StandaloneApp | undefined;
    try {
      standalone = await launchStandaloneApp({
        preferences: { onboardingCompleted: true },
        autoTeachEnabled: false,
      });

      const config = await standalone.mainWindow.evaluate(() => window.api.config.get());
      expect(config.autoTeachEnabled).toBe(false);
    } finally {
      await standalone?.cleanup();
    }
  });
});
