import { ipcMain, BrowserWindow } from "electron";
import { getShortcuts, setShortcut } from "../../services/ConfigStore";
import { updateShortcut } from "../../services/HotkeyService";
import { m } from "../../../renderer/paraglide/messages";

type RebindableKey = "transcription" | "pasteLastTranscript" | "viewLastDiff" | "actionMode";

const REBINDABLE_KEYS: readonly RebindableKey[] = [
  "transcription",
  "pasteLastTranscript",
  "viewLastDiff",
  "actionMode",
];

function isRebindableKey(key: string): key is RebindableKey {
  return (REBINDABLE_KEYS as readonly string[]).includes(key);
}

function broadcastShortcutsChanged(): void {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send("shortcuts:changed");
    }
  }
}

function applyShortcutChange(
  key: string,
  accelerator: string
): { success: boolean; error?: string } {
  if (key === "cancelRecording") {
    setShortcut("cancelRecording", accelerator);
    return { success: true };
  }
  if (!isRebindableKey(key)) {
    return { success: false, error: m.notice_invalid_shortcut_key() };
  }
  return updateShortcut(key, accelerator);
}

export function setupShortcutsHandlers(): void {
  ipcMain.handle("shortcuts:get", async () => {
    return { success: true, data: getShortcuts() };
  });

  ipcMain.handle("shortcuts:set", async (_event, key: string, accelerator: string) => {
    const result = applyShortcutChange(key, accelerator);
    if (result.success) broadcastShortcutsChanged();
    return result;
  });
}
