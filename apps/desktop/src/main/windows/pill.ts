import { BrowserWindow, screen } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";
import { getAppRendererUrl } from "../services/app-protocol";
import { getMainWindow } from "./main";
import type { BadgeUnlockPayload } from "../../shared/ipc-types";

let pillWindow: BrowserWindow | null = null;
let celebrationActive = false;

const PILL_WINDOW_HEIGHT = 320;
const WINDOW_MARGIN_BOTTOM = 8;

function getAnchorDisplay() {
  const cursorPoint = screen.getCursorScreenPoint();
  return screen.getDisplayNearestPoint(cursorPoint);
}

function positionFullWidth(win: BrowserWindow): void {
  const { workArea } = getAnchorDisplay();

  const x = workArea.x;
  const y = workArea.y + workArea.height - PILL_WINDOW_HEIGHT - WINDOW_MARGIN_BOTTOM;
  const width = workArea.width;

  win.setBounds({ x, y, width, height: PILL_WINDOW_HEIGHT }, false);
}

export function createPillWindow(): BrowserWindow {
  const { workArea } = getAnchorDisplay();

  pillWindow = new BrowserWindow({
    width: workArea.width,
    height: PILL_WINDOW_HEIGHT,
    type: "panel",
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hiddenInMissionControl: true,
    resizable: false,
    show: false,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.platform === "darwin") {
    pillWindow.excludedFromShownWindowsMenu = true;
    pillWindow.setAlwaysOnTop(true, "pop-up-menu");
    pillWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });
  }

  pillWindow.setIgnoreMouseEvents(true, { forward: true });

  positionFullWidth(pillWindow);

  const onDisplayMetricsChanged = () => {
    if (pillWindow && !pillWindow.isDestroyed() && pillWindow.isVisible()) {
      positionFullWidth(pillWindow);
    }
  };
  screen.on("display-metrics-changed", onDisplayMetricsChanged);
  pillWindow.on("closed", () => {
    screen.removeListener("display-metrics-changed", onDisplayMetricsChanged);
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    pillWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#/pill`);
  } else {
    pillWindow.loadURL(getAppRendererUrl("/pill"));
  }

  pillWindow.on("closed", () => {
    pillWindow = null;
  });

  pillWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    if (message.includes("CleanUnusedInitializersAndNodeArgs")) return;

    const prefix = ["[VERBOSE]", "[LOG]", "[WARN]", "[ERR]"][level] || "[LOG]";
    console.log(`[PillWin:renderer] ${prefix} ${message} (${sourceId}:${line})`);
  });

  pillWindow.webContents.on("did-finish-load", () => {
    console.log("[PillWin] did-finish-load, URL:", pillWindow?.webContents.getURL());
  });

  pillWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("[PillWindow] Renderer crashed:", details.reason, details.exitCode);
  });

  pillWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    console.error("[PillWindow] Failed to load:", errorCode, errorDescription);
  });

  return pillWindow;
}

export function getPillWindow(): BrowserWindow | null {
  return pillWindow;
}

export function showPillWindow(): void {
  if (!pillWindow) return;
  positionFullWidth(pillWindow);
  pillWindow.showInactive();
}

export function hidePillWindow(): void {
  if (!pillWindow) return;
  if (celebrationActive) return;
  pillWindow.hide();
}

export function setCelebrationActive(value: boolean): void {
  celebrationActive = value;
}

export function setPillIgnoreMouseEvents(ignore: boolean): void {
  if (!pillWindow || pillWindow.isDestroyed()) return;
  if (ignore) {
    pillWindow.setIgnoreMouseEvents(true, { forward: true });
  } else {
    pillWindow.setIgnoreMouseEvents(false);
  }
}

export function sendPillBadgeUnlock(payload: BadgeUnlockPayload): void {
  if (pillWindow && !pillWindow.isDestroyed()) {
    celebrationActive = true;
    pillWindow.webContents.send("pill:badge-unlock", payload);
  }
}

export function sendPillRecordingStart(): void {
  if (pillWindow && !pillWindow.isDestroyed()) {
    pillWindow.webContents.send("recording:start");
  }
  const main = getMainWindow();
  if (main && !main.isDestroyed()) {
    main.webContents.send("recording:start");
  }
}

export function broadcastRecordingStop(): void {
  if (pillWindow && !pillWindow.isDestroyed()) {
    pillWindow.webContents.send("recording:stop");
  }
  const main = getMainWindow();
  if (main && !main.isDestroyed()) {
    main.webContents.send("recording:stop");
  }
}

export function sendPillCancelShortcut(): void {
  if (pillWindow && !pillWindow.isDestroyed()) {
    pillWindow.webContents.send("recording:cancel-shortcut");
  }
}

export function sendPillSkillApplying(active: boolean): void {
  if (pillWindow && !pillWindow.isDestroyed()) {
    pillWindow.webContents.send("pill:skill-applying", active);
  }
}

export function sendPillViewLastDiff(): void {
  if (pillWindow && !pillWindow.isDestroyed()) {
    pillWindow.webContents.send("shortcut:view-last-diff");
  }
}

export function hidePillWindowAfterDelay(ms: number): ReturnType<typeof setTimeout> {
  return setTimeout(() => hidePillWindow(), ms);
}
