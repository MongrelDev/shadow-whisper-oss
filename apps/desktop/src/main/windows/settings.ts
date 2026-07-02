import { BrowserWindow, app } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";
import { getAppRendererUrl } from "../services/app-protocol";

let settingsWindow: BrowserWindow | null = null;
let isQuitting = false;
let beforeQuitRegistered = false;

export function createSettingsWindow(): BrowserWindow {
  // Register before-quit handler only once, after app is ready
  if (!beforeQuitRegistered) {
    app.on("before-quit", () => {
      isQuitting = true;
    });
    beforeQuitRegistered = true;
  }
  settingsWindow = new BrowserWindow({
    width: 680,
    height: 480,
    frame: false,
    transparent: false,
    resizable: false,
    show: false,
    backgroundColor: "#111318", // Zed dark bg
    titleBarStyle: "hidden",
    trafficLightPosition: { x: -100, y: -100 }, // Hide traffic lights
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Center on screen
  settingsWindow.center();

  // Load renderer with #/settings hash route
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    settingsWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#/settings`);
  } else {
    settingsWindow.loadURL(getAppRendererUrl("/settings"));
  }

  // Hide instead of close (unless app is quitting)
  settingsWindow.on("close", (event) => {
    if (!isQuitting && settingsWindow && !settingsWindow.isDestroyed()) {
      event.preventDefault();
      settingsWindow.hide();
    }
  });

  return settingsWindow;
}

export function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow;
}

export function showSettings(): void {
  if (!settingsWindow) return;
  settingsWindow.center();
  settingsWindow.show();
  settingsWindow.focus();
}

export function hideSettings(): void {
  if (!settingsWindow) return;
  settingsWindow.hide();
}
