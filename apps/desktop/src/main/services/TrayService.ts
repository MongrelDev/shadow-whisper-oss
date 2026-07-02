import { Tray, Menu, nativeImage, app } from "electron";
import { join } from "path";
import { existsSync } from "fs";
import { showMainWindow } from "../windows/main";
import { m } from "../../renderer/paraglide/messages";

// IMPORTANT: Keep tray reference globally to prevent garbage collection
// See: https://www.electronjs.org/docs/latest/api/tray
let tray: Tray | null = null;

function buildContextMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: m.tray_home(),
      click: () => {
        showMainWindow();
      },
    },
    { type: "separator" },
    {
      label: m.tray_check_for_updates(),
      click: () => {
        // No-op for now
      },
    },
    {
      label: m.tray_paste_last_transcript(),
      accelerator: "CmdOrCtrl+V",
      click: () => {
        // No-op for now
      },
    },
    { type: "separator" },
    {
      label: m.tray_shortcuts(),
      click: () => {
        // No-op for now
      },
    },
    {
      label: m.tray_microphone(),
      submenu: [
        {
          label: m.tray_microphone_system_default(),
          type: "radio",
          checked: true,
          click: () => {
            // No-op for now
          },
        },
      ],
    },
    { type: "separator" },
    {
      label: m.tray_help_center(),
      click: () => {
        // No-op for now
      },
    },
    {
      label: m.tray_talk_to_support(),
      accelerator: "CmdOrCtrl+?",
      click: () => {
        // No-op for now
      },
    },
    {
      label: m.tray_general_feedback(),
      click: () => {
        // No-op for now
      },
    },
    { type: "separator" },
    {
      label: m.tray_quit(),
      accelerator: "CmdOrCtrl+Q",
      click: () => {
        app.quit();
      },
    },
  ]);
}

function getTrayIconPath(iconName: string): string {
  return app.isPackaged
    ? join(process.resourcesPath, iconName)
    : join(app.getAppPath(), "resources", iconName);
}

function createFallbackTrayIcon(): Electron.NativeImage {
  const fallbackDataUrl =
    "data:image/svg+xml;base64,PHN2ZwogIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICB3aWR0aD0iMTAyIgogIGhlaWdodD0iODAiCiAgdmlld0JveD0iMCAwIDEwMiA4MCIKICBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0Igo+CiAgPGcgZmlsbD0iIzQ0M2Y4ZiIgc3Ryb2tlPSJub25lIj4KICAgIDxyZWN0IHg9IjAiIHk9IjI4IiB3aWR0aD0iNiIgaGVpZ2h0PSIyNCIgcng9IjMiIC8+CiAgICA8cmVjdCB4PSIxNiIgeT0iMjAiIHdpZHRoPSI2IiBoZWlnaHQ9IjQwIiByeD0iMyIgLz4KICAgIDxyZWN0IHg9IjMyIiB5PSIwIiB3aWR0aD0iNiIgaGVpZ2h0PSI4MCIgcng9IjMiIC8+CiAgICA8cmVjdCB4PSI0OCIgeT0iMjgiIHdpZHRoPSI2IiBoZWlnaHQ9IjI0IiByeD0iMyIgLz4KICAgIDxyZWN0IHg9IjY0IiB5PSIxMS43IiB3aWR0aD0iNiIgaGVpZ2h0PSI1Ni42IiByeD0iMyIgLz4KICAgIDxyZWN0IHg9IjgwIiB5PSIwIiB3aWR0aD0iNiIgaGVpZ2h0PSI4MCIgcng9IjMiIC8+CiAgICA8cmVjdCB4PSI5NiIgeT0iMjgiIHdpZHRoPSI2IiBoZWlnaHQ9IjI0IiByeD0iMyIgLz4KICA8L2c+Cjwvc3ZnPgo=";
  return nativeImage.createFromDataURL(fallbackDataUrl);
}

function createTrayIcon(iconPath: string): Electron.NativeImage {
  if (existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }
  return nativeImage.createEmpty();
}

function finalizeTrayIcon(trayIcon: Electron.NativeImage): Electron.NativeImage {
  const icon = trayIcon.isEmpty() ? createFallbackTrayIcon() : trayIcon;
  if (process.platform === "darwin" && !icon.isEmpty()) {
    icon.setTemplateImage(true);
  }
  return icon;
}

export function setupTray(): void {
  // For macOS, use Template Image (filename must end with "Template")
  // Template images automatically adapt to light/dark menu bar
  // See: https://www.electronjs.org/docs/latest/api/tray#template-images
  const iconName = process.platform === "darwin" ? "iconTemplate.png" : "icon.png";
  const trayIcon = finalizeTrayIcon(createTrayIcon(getTrayIconPath(iconName)));

  tray = new Tray(trayIcon);
  tray.setContextMenu(buildContextMenu());
  tray.setToolTip("ShadowWhisper");
}

export function getTray(): Tray | null {
  return tray;
}
