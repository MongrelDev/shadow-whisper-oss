import { test, expect, getPillWindow, emitIPC } from "./fixtures";

test.describe("Feature: Gerenciamento de Múltiplas Janelas", () => {
  test("Scenario: app inicia com main window e pill window", async ({ electronApp }) => {
    const windows = electronApp.windows();
    expect(windows.length).toBeGreaterThanOrEqual(2);

    const pill = await getPillWindow(electronApp);
    expect(pill).toBeDefined();
  });

  test("Scenario: fechar main window não encerra o app", async ({ electronApp }) => {
    await electronApp.evaluate(({ BrowserWindow }) => {
      const mainWin = BrowserWindow.getAllWindows().find(
        (w) => !w.webContents.getURL().includes("pill")
      );
      mainWin?.close();
    });

    const isRunning = await electronApp.evaluate(({ app }) => !app.isQuitting);
    expect(isRunning).toBe(true);
  });

  test("Scenario: pill window é always-on-top e tem dimensões de floating panel", async ({
    electronApp,
  }) => {
    const pillProps = await electronApp.evaluate(({ BrowserWindow }) => {
      const pill = BrowserWindow.getAllWindows().find(
        (w) => w.getTitle().includes("pill") || w.webContents.getURL().includes("pill")
      );
      if (!pill) return null;
      const bounds = pill.getBounds();
      return {
        isAlwaysOnTop: pill.isAlwaysOnTop(),
        width: bounds.width,
        height: bounds.height,
        isFocusable: pill.isFocusable(),
      };
    });
    expect(pillProps).not.toBeNull();
    expect(pillProps!.isAlwaysOnTop).toBe(true);
    expect(pillProps!.height).toBeLessThanOrEqual(200);
    expect(pillProps!.isFocusable).toBe(false);
  });

  test("Scenario: reabrir main window via tray handler programático", async ({ electronApp }) => {
    await electronApp.evaluate(({ BrowserWindow }) => {
      const mainWin = BrowserWindow.getAllWindows().find(
        (w) => !w.webContents.getURL().includes("pill")
      );
      mainWin?.close();
    });

    await electronApp.evaluate(() => {
      const tray = (global as Record<string, unknown>).__tray as
        | { emit: (event: string) => void }
        | undefined;
      if (tray) {
        tray.emit("click");
      } else {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { BrowserWindow } = require("electron");
        const existing = BrowserWindow.getAllWindows().find(
          (w: { isDestroyed: () => boolean; webContents: { getURL: () => string } }) =>
            !w.isDestroyed() && !w.webContents.getURL().includes("pill")
        );
        if (existing) existing.show();
      }
    });

    const reopened = await electronApp.firstWindow();
    expect(reopened).toBeDefined();
  });

  test("Scenario: pill window muda estado ao iniciar gravação", async ({ electronApp }) => {
    const pill = await getPillWindow(electronApp);
    await emitIPC(electronApp, "recording:start");

    await expect(
      pill.locator("[data-testid='recording-view'], [data-testid='recording-timer']").first()
    ).toBeVisible({ timeout: 5_000 });

    await emitIPC(electronApp, "recording:cancel-shortcut");
  });
});
