import { BrowserWindow, shell } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";
import { getConfig } from "../services/ConfigStore";
import { getAppRendererUrl } from "../services/app-protocol";

function isInternalRendererUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "file:" || parsed.protocol === "app:") return true;
    const devUrl = process.env["ELECTRON_RENDERER_URL"];
    if (devUrl) return parsed.origin === new URL(devUrl).origin;
    return false;
  } catch {
    return false;
  }
}

let mainWindow: BrowserWindow | null = null;

export function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 420,
    minHeight: 500,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 18 },
    resizable: true,
    maximizable: true,
    fullscreenable: true,
    show: false,
    backgroundColor: "#0f1115",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const config = getConfig();
  const initialRoute = config.preferences.onboardingCompleted ? "/app" : "/app?onboarding=welcome";

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#${initialRoute}`);
  } else {
    mainWindow.loadURL(getAppRendererUrl(initialRoute));
  }

  const redirectExternalNavigation = (event: Electron.Event, url: string) => {
    if (isInternalRendererUrl(url)) return;
    event.preventDefault();
    void shell.openExternal(url);
  };

  mainWindow.webContents.on("will-navigate", redirectExternalNavigation);
  mainWindow.webContents.on("will-redirect", redirectExternalNavigation);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // On macOS, closing window should hide to tray instead of quitting
  mainWindow.on("close", (event) => {
    if (process.platform === "darwin" && mainWindow) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function showMainWindow(): void {
  if (!mainWindow) {
    createMainWindow();
  }

  if (mainWindow) {
    mainWindow.center();
    mainWindow.show();
    mainWindow.focus();
  }
}

export function hideMainWindow(): void {
  if (mainWindow) {
    mainWindow.hide();
  }
}
