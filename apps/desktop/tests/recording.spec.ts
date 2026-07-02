import { test, expect, getPillWindow, emitIPC } from "./fixtures";

test.describe("Feature: Gravação de Áudio e Transcrição", () => {
  test("Scenario: pill window existe ao iniciar o app", async ({ electronApp }) => {
    const pill = await getPillWindow(electronApp);
    expect(pill).toBeDefined();
  });

  test("Scenario: iniciar gravação via IPC muda pill para recording", async ({ electronApp }) => {
    const pill = await getPillWindow(electronApp);

    await emitIPC(electronApp, "recording:start");

    await expect(
      pill.locator("[data-testid='recording-timer'], [data-testid='recording-view']").first()
    ).toBeVisible({
      timeout: 5_000,
    });
  });

  test("Scenario: cancelar gravação via IPC volta pill ao estado anterior", async ({
    electronApp,
  }) => {
    const pill = await getPillWindow(electronApp);

    await emitIPC(electronApp, "recording:start");
    await pill.waitForTimeout(500);

    await emitIPC(electronApp, "recording:cancel-shortcut");

    await expect(
      pill.locator("[data-testid='recording-timer'], [data-testid='recording-view']").first()
    ).not.toBeVisible({ timeout: 5_000 });
  });

  test("Scenario: transcrição retorna texto mockado via API", async ({
    electronApp,
    mainWindow,
    mockApi,
  }) => {
    mockApi.setTranscript("olá mundo transcrito");
    mockApi.clearRequests();

    await emitIPC(electronApp, "recording:start");
    await mainWindow.waitForTimeout(300);
    await emitIPC(electronApp, "recording:stop");

    await expect
      .poll(() => mockApi.getRequests().some((r) => r.pathname.includes("/transcribe")), {
        timeout: 10_000,
      })
      .toBe(true);
  });

  test("Scenario: pill window exibe timer durante gravação", async ({ electronApp }) => {
    const pill = await getPillWindow(electronApp);

    await emitIPC(electronApp, "recording:start");

    const timerLocator = pill.locator("[data-testid='recording-timer']").first();
    await expect(timerLocator).toBeVisible({ timeout: 5_000 });

    await expect
      .poll(
        async () => {
          const text = await timerLocator.textContent();
          return text && /0:\d{2}/.test(text) && text !== "0:00";
        },
        { timeout: 5_000 }
      )
      .toBe(true);

    await emitIPC(electronApp, "recording:cancel-shortcut");
  });

  test("Scenario: transcrição com erro 500 não quebra o app", async ({
    electronApp,
    mainWindow,
    mockApi,
  }) => {
    mockApi.setTranscribeStatus(500);
    mockApi.clearRequests();

    await emitIPC(electronApp, "recording:start");
    await mainWindow.waitForTimeout(300);
    await emitIPC(electronApp, "recording:stop");

    await expect
      .poll(() => mockApi.getRequests().some((r) => r.pathname.includes("/transcribe")), {
        timeout: 10_000,
      })
      .toBe(true);

    const isRunning = await electronApp.evaluate(({ app }) => !app.isQuitting);
    expect(isRunning).toBe(true);

    const pill = await getPillWindow(electronApp);
    await expect(pill.locator("[data-testid='recording-timer']").first()).not.toBeVisible({
      timeout: 5_000,
    });
  });
});
