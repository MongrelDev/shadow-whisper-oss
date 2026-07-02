import {
  test,
  expect,
  launchStandaloneApp,
  mockSessionRoute,
  API_ORIGIN,
  type StandaloneApp,
} from "./fixtures";

test.describe("Feature: Fluxo de Onboarding (6 etapas)", () => {
  test("Scenario: onboarding é exibido quando não completado", async () => {
    let standalone: StandaloneApp | undefined;
    try {
      standalone = await launchStandaloneApp({ preferences: { onboardingCompleted: false } });
      await standalone.mainWindow.route(`${API_ORIGIN}/**`, mockSessionRoute(true));
      await expect(standalone.mainWindow).toHaveURL(/onboarding=welcome/, { timeout: 10_000 });
    } finally {
      await standalone?.cleanup();
    }
  });

  test("Scenario: onboarding não aparece quando já completado", async ({ mainWindow }) => {
    await mainWindow.waitForURL(/app/, { timeout: 10_000 });
    await expect(mainWindow).not.toHaveURL(/onboarding/);
  });

  test("Scenario: trocar idioma no onboarding", async () => {
    let standalone: StandaloneApp | undefined;
    try {
      standalone = await launchStandaloneApp({ preferences: { onboardingCompleted: false } });
      await standalone.mainWindow.route(`${API_ORIGIN}/**`, mockSessionRoute(true));
      await expect(standalone.mainWindow).toHaveURL(/onboarding=welcome/, { timeout: 10_000 });

      const ptButton = standalone.mainWindow.getByText(/português|pt-br/i).first();
      await expect(ptButton).toBeVisible({ timeout: 5_000 });
      await ptButton.click();

      await expect(
        standalone.mainWindow.getByText(/próximo|continuar|bem-vindo/i).first()
      ).toBeVisible({ timeout: 5_000 });
    } finally {
      await standalone?.cleanup();
    }
  });

  test("Scenario: navegar por todas as 6 etapas", async () => {
    let standalone: StandaloneApp | undefined;
    try {
      standalone = await launchStandaloneApp({ preferences: { onboardingCompleted: false } });
      const { mainWindow } = standalone;
      await mainWindow.route(`${API_ORIGIN}/**`, mockSessionRoute(true));

      await expect(mainWindow).toHaveURL(/onboarding=welcome/, { timeout: 10_000 });

      const stepLabels = ["welcome", "permissions", "shortcut", "skills", "plan", "done"];
      for (let i = 0; i < stepLabels.length - 1; i++) {
        const nextButton = mainWindow
          .getByRole("button", { name: /next|próximo|continue|continuar/i })
          .first();
        await nextButton.click();
        await expect(mainWindow).toHaveURL(new RegExp(`onboarding=${stepLabels[i + 1]}`), {
          timeout: 5_000,
        });
      }

      const finishButton = mainWindow
        .getByRole("button", { name: /done|pronto|finish|finalizar|let's go|vamos/i })
        .first();
      await finishButton.click();

      await expect(mainWindow).not.toHaveURL(/onboarding/, { timeout: 5_000 });
    } finally {
      await standalone?.cleanup();
    }
  });
});
