import { app, BrowserWindow, nativeImage, protocol, session } from "electron";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { existsSync } from "fs";
import { join } from "path";
import { APP_PROTOCOL_PRIVILEGES, registerAppProtocol } from "./services/app-protocol";

if (process.env.ELECTRON_USER_DATA_DIR) {
  app.setPath("userData", process.env.ELECTRON_USER_DATA_DIR);
}

if (process.env.NODE_ENV === "test") {
  app.commandLine.appendSwitch("use-fake-device-for-media-stream");
  app.commandLine.appendSwitch("use-fake-ui-for-media-stream");
}

// `protocol.registerSchemesAsPrivileged` must be called exactly once, before
// `app.whenReady()`. Register both the app:// scheme and the deep-link scheme
// together so neither overwrites the other.
protocol.registerSchemesAsPrivileged([
  APP_PROTOCOL_PRIVILEGES,
  {
    scheme: "com.shadowwhisper.app",
    privileges: { standard: false, secure: true },
  },
]);

import { createMainWindow } from "./windows/main";
import { showMainWindow } from "./windows/main";
import { createPillWindow, showPillWindow, sendPillRecordingStart } from "./windows/pill";
import { setupTray } from "./services/TrayService";
import {
  setupGlobalShortcuts,
  unregisterGlobalShortcuts,
  setRecordingCallbacks,
  registerCancelShortcut,
} from "./services/HotkeyService";
import { setupIpcHandlers } from "./ipc/handlers";
import { checkAccessibility } from "./services/KeyboardService";
import { startBackgroundTasks, stopBackgroundTasks } from "./services/BackgroundTasks";
import { getLocale as getConfiguredLocale } from "./services/ConfigStore";
import { overwriteGetLocale } from "../renderer/paraglide/runtime";
import { initAuthBridge } from "./services/auth-bridge";
import { emitAuthDebug } from "./services/auth-debug";
import { initPurchaseDeepLink } from "./services/purchase-deeplink";
import { authClient } from "./lib/auth-client";

// NOTE: `app.disableHardwareAcceleration()` was previously called here as a
// workaround for transparent windows not rendering on some systems
// (https://github.com/electron/electron/issues/40515). It is removed because
// it strips `navigator.mediaDevices` from renderers loaded over custom
// protocols like `app://`, breaking `getUserMedia`. If the pill window
// transparency regresses on some GPUs, use a per-window workaround instead.

function resolveMacAppIconPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, "app-icon.png")
    : join(app.getAppPath(), "resources", "app-icon.png");
}

authClient.setupMain();
initAuthBridge();
initPurchaseDeepLink();

{
  app.on("open-url", (_event, url) => {
    emitAuthDebug("open-url", { url });
  });

  app.on("second-instance", (_event, commandLine, _workingDirectory, url) => {
    const fallback = typeof commandLine.at(-1) === "string" ? commandLine.at(-1) : undefined;
    emitAuthDebug("second-instance", { url: url ?? fallback ?? "<no-url>" });
  });

  app.whenReady().then(() => {
    emitAuthDebug("app-ready", {
      platform: process.platform,
      workerURL: __WORKER_URL__,
      webURL: __WEB_URL__,
      rendererURL: process.env["ELECTRON_RENDERER_URL"] ?? null,
    });
    electronApp.setAppUserModelId("com.shadowwhisper.app");
    registerAppProtocol();

    // Grant media (mic/camera) to our renderer so getUserMedia reaches
    // the macOS TCC layer. Other permissions fall through to Electron's
    // default (grant) — do NOT register a permission-check handler, as
    // returning false for non-media permissions strips navigator.mediaDevices.
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      if (permission === "media" || permission === "mediaKeySystem") {
        callback(true);
        return;
      }
      callback(true);
    });

    app.on("browser-window-created", (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    // Keep the Dock visible during local development so the app can be
    // reopened easily. Production remains tray-only on macOS.
    if (process.platform === "darwin" && app.dock) {
      if (is.dev) {
        app.dock.show();

        const iconPath = resolveMacAppIconPath();
        if (existsSync(iconPath)) {
          app.dock.setIcon(nativeImage.createFromPath(iconPath));
        }
      } else {
        app.dock.hide();
      }
    }

    overwriteGetLocale(() => getConfiguredLocale());

    // Setup IPC handlers before creating windows
    setupIpcHandlers();

    // Create main window (hidden by default, shows from tray)
    createMainWindow();

    createPillWindow();
    showPillWindow();

    // Setup tray icon and context menu
    setupTray();

    // Check accessibility permissions (required for keyboard simulation on macOS)
    // Passing true will prompt the user if not already granted
    checkAccessibility(true);

    setRecordingCallbacks(() => {
      showPillWindow();
      sendPillRecordingStart();
      registerCancelShortcut();
    });

    // Setup global hotkeys
    setupGlobalShortcuts();

    // Start background maintenance tasks (audio cleanup, etc.)
    startBackgroundTasks();

    app.on("activate", () => {
      if (process.platform === "darwin" && is.dev) {
        showMainWindow();
        return;
      }

      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  // Keep app running when all windows are closed (tray-only)
  app.on("window-all-closed", () => {
    // Don't quit - we're a tray-only app
    // User must quit via tray menu or hotkey
  });

  // Cleanup on quit
  app.on("will-quit", () => {
    stopBackgroundTasks();
    unregisterGlobalShortcuts();
  });

  // Force clean exit - close all windows and release lock
  app.on("before-quit", () => {
    // Close all windows forcefully
    BrowserWindow.getAllWindows().forEach((win) => {
      win.removeAllListeners("close");
      win.destroy();
    });
  });

  app.on("quit", () => {
    // Force exit to ensure all child processes are killed
    process.exit(0);
  });
}
