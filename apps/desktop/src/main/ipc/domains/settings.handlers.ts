import { ipcMain, app, shell, systemPreferences, Notification } from "electron";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { showSettings, hideSettings } from "../../windows/settings";
import { m } from "../../../renderer/paraglide/messages";

const execFileAsync = promisify(execFile);

function getMicrophoneAccessStatus():
  | "granted"
  | "not-determined"
  | "denied"
  | "restricted"
  | "unknown" {
  if (process.platform !== "darwin" && process.platform !== "win32") {
    return "granted";
  }

  return systemPreferences.getMediaAccessStatus("microphone");
}

function toUnknownError(error: unknown, fallback: string) {
  return {
    success: false as const,
    error: error instanceof Error ? error.message : fallback,
  };
}

async function getMicrophonePermissionResult() {
  try {
    const status = getMicrophoneAccessStatus();
    console.log("[mic] get-microphones status=", status);

    if (process.platform === "darwin") {
      if (status !== "not-determined") {
        return { success: status === "granted", status };
      }

      const granted = await systemPreferences.askForMediaAccess("microphone");
      console.log("[mic] askForMediaAccess resolved=", granted);
      return { success: granted, status: granted ? "granted" : "denied" };
    }

    if (process.platform === "win32") {
      return { success: status === "granted", status };
    }

    return { success: true, status: "granted" as const };
  } catch (error) {
    console.error("[IPC] Microphone access error:", error);
    return toUnknownError(error, "Unknown error");
  }
}

async function openMacMicrophonePrivacy() {
  const microphonePrivacyUrl =
    "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone";

  try {
    await shell.openExternal(microphonePrivacyUrl);
    return { success: true as const };
  } catch (error) {
    console.warn("[IPC] Failed to open microphone privacy via shell.openExternal", error);
  }

  try {
    await execFileAsync("open", [microphonePrivacyUrl]);
    return { success: true as const };
  } catch (error) {
    console.warn("[IPC] Failed to open microphone privacy via `open`", error);
  }

  try {
    await execFileAsync("open", ["/System/Applications/System Settings.app"]);
    return { success: true as const };
  } catch (error) {
    console.error("[IPC] Failed to open System Settings", error);
    return toUnknownError(error, "Failed to open System Settings");
  }
}

async function openWindowsMicrophonePrivacy() {
  try {
    await shell.openExternal("ms-settings:privacy-microphone");
    return { success: true as const };
  } catch (error) {
    console.error("[IPC] Failed to open Windows microphone privacy settings", error);
    return toUnknownError(error, "Failed to open Windows Settings");
  }
}

async function openMicrophoneSupportPage() {
  try {
    await shell.openExternal("https://support.shadowwhisper.com/microphone-permission");
    return { success: true as const };
  } catch (error) {
    console.error("[IPC] Failed to open microphone support page", error);
    return toUnknownError(error, "Failed to open support page");
  }
}

async function openMicrophonePrivacySettings() {
  if (process.platform === "darwin") return openMacMicrophonePrivacy();
  if (process.platform === "win32") return openWindowsMicrophonePrivacy();
  return openMicrophoneSupportPage();
}

export function setupSettingsHandlers(): void {
  ipcMain.on("settings:show", () => {
    showSettings();
  });

  ipcMain.on("settings:hide", () => {
    hideSettings();
  });

  ipcMain.handle("settings:get-microphones", async () => getMicrophonePermissionResult());

  ipcMain.handle("settings:check-microphone-status", () => {
    const status = getMicrophoneAccessStatus();
    console.log("[mic] check-microphone-status status=", status);
    if (process.platform === "darwin" || process.platform === "win32") {
      return status === "granted";
    }
    return true;
  });

  ipcMain.handle("settings:check-accessibility", (_event, prompt: boolean) => {
    if (process.platform === "darwin") {
      return systemPreferences.isTrustedAccessibilityClient(prompt);
    }
    return true;
  });

  ipcMain.handle("settings:get-launch-at-login", () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.on("settings:set-launch-at-login", (_event, enabled: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enabled });
  });

  ipcMain.handle("settings:request-notification-permission", () => {
    if (!Notification.isSupported()) {
      return { success: false, error: m.notice_notifications_not_supported() };
    }
    const notification = new Notification({
      title: "ShadowWhisper",
      body: m.notice_notifications_enabled_body(),
    });
    notification.show();
    // Electron has no API to check macOS notification authorization.
    // show() triggers the system prompt on first call but is silently
    // ignored if the user denied. Return `requested` so the UI never
    // claims the permission was verified as granted.
    return { success: true, requested: true };
  });

  ipcMain.handle("settings:check-notification-support", () => {
    return Notification.isSupported();
  });

  ipcMain.handle("settings:open-microphone-privacy", async () => openMicrophonePrivacySettings());
}
