import {
  test,
  expect,
  launchStandaloneApp,
  mockSessionRoute,
  API_ORIGIN,
  getPillWindow,
  emitIPC,
  type StandaloneApp,
} from "./fixtures";

test.describe("Feature: Permissão de Microfone no Desktop", () => {
  test("Scenario: getUserMedia é auto-concedido com fake device em modo test", async () => {
    let standalone: StandaloneApp | undefined;
    try {
      standalone = await launchStandaloneApp({ preferences: { onboardingCompleted: true } });
      await standalone.mainWindow.route(`${API_ORIGIN}/**`, mockSessionRoute(true));

      const hasPermission = await standalone.mainWindow.evaluate(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
          return true;
        } catch {
          return false;
        }
      });
      expect(hasPermission).toBe(true);
    } finally {
      await standalone?.cleanup();
    }
  });

  test("Scenario: gravação funciona após permissão concedida", async ({ electronApp }) => {
    const pill = await getPillWindow(electronApp);

    await emitIPC(electronApp, "recording:start");

    await expect(
      pill.locator("[data-testid='recording-timer'], [data-testid='recording-view']").first()
    ).toBeVisible({ timeout: 5_000 });

    await emitIPC(electronApp, "recording:cancel-shortcut");
  });

  test("Scenario: onboarding etapa Permissions permite getUserMedia", async () => {
    let standalone: StandaloneApp | undefined;
    try {
      standalone = await launchStandaloneApp({ preferences: { onboardingCompleted: false } });
      const { mainWindow } = standalone;
      await mainWindow.route(`${API_ORIGIN}/**`, mockSessionRoute(true));

      await expect(mainWindow).toHaveURL(/onboarding=welcome/, { timeout: 10_000 });

      const nextButton = mainWindow
        .getByRole("button", { name: /next|próximo|continue|continuar/i })
        .first();
      await nextButton.click();

      await expect(mainWindow).toHaveURL(/onboarding=permissions/, { timeout: 5_000 });

      const hasPermission = await mainWindow.evaluate(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
          return true;
        } catch {
          return false;
        }
      });
      expect(hasPermission).toBe(true);
    } finally {
      await standalone?.cleanup();
    }
  });
});
