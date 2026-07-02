import {
  test,
  expect,
  launchStandaloneApp,
  mockSessionRoute,
  API_ORIGIN,
  type StandaloneApp,
} from "./fixtures";

test.describe("Feature: Autenticação do Usuário", () => {
  test("Scenario: redireciona para login quando não autenticado", async () => {
    let standalone: StandaloneApp | undefined;
    try {
      standalone = await launchStandaloneApp(
        { preferences: { onboardingCompleted: true } },
        { seedToken: false }
      );
      await standalone.mainWindow.route(`${API_ORIGIN}/**`, mockSessionRoute(false));
      await expect(standalone.mainWindow).toHaveURL(/auth\/login/, { timeout: 10_000 });
    } finally {
      await standalone?.cleanup();
    }
  });

  test("Scenario: desktop oferece uma unica entrada para autenticacao no navegador", async () => {
    let standalone: StandaloneApp | undefined;
    try {
      standalone = await launchStandaloneApp(
        { preferences: { onboardingCompleted: true } },
        { seedToken: false }
      );
      const { mainWindow } = standalone;
      await mainWindow.route(`${API_ORIGIN}/**`, mockSessionRoute(false));
      await mainWindow.evaluate(() => {
        window.location.hash = "#/auth/login";
      });
      await expect(mainWindow).toHaveURL(/auth\/login/, { timeout: 5_000 });

      const continueButton = mainWindow.getByRole("button", {
        name: /Continuar no navegador|Continue in browser/,
      });
      await expect(continueButton).toHaveCount(1);
      await expect(
        mainWindow.getByRole("button", { name: /Criar conta|Create account/ })
      ).toHaveCount(0);
      await expect(continueButton).toBeEnabled();

      await mainWindow.setViewportSize({ width: 420, height: 500 });
      await expect(continueButton).toBeVisible();
      await expect
        .poll(() =>
          mainWindow.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
        )
        .toBe(true);

      await mainWindow.evaluate(() => {
        window.location.hash = "#/auth/signup";
      });
      await expect(mainWindow).toHaveURL(/auth\/login/, { timeout: 5_000 });
    } finally {
      await standalone?.cleanup();
    }
  });

  test("Scenario: sessão persiste após reiniciar o app", async () => {
    let standalone1: StandaloneApp | undefined;
    let standalone2: StandaloneApp | undefined;
    try {
      standalone1 = await launchStandaloneApp({ preferences: { onboardingCompleted: true } });
      await standalone1.mainWindow.route(`${API_ORIGIN}/**`, mockSessionRoute(true));
      await expect(standalone1.mainWindow).toHaveURL(/app/, { timeout: 10_000 });
      await standalone1.app.close();

      standalone2 = await launchStandaloneApp({ preferences: { onboardingCompleted: true } });
      await standalone2.mainWindow.route(`${API_ORIGIN}/**`, mockSessionRoute(true));
      await expect(standalone2.mainWindow).toHaveURL(/app/, { timeout: 10_000 });
      await expect(standalone2.mainWindow).not.toHaveURL(/auth\/login/);
    } finally {
      await standalone2?.cleanup();
    }
  });

  test("Scenario: logout redireciona para login", async ({ mainWindow, mockApi }) => {
    await mainWindow.waitForURL(/app/, { timeout: 10_000 });

    mockApi.setAuthenticated(false);
    await mainWindow.evaluate(() => window.api.auth.signOut());

    await expect(mainWindow).toHaveURL(/auth\/login/, { timeout: 5_000 });
  });
});
