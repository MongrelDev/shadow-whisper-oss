import { clipboard, ipcMain } from "electron";

export function setupClipboardHandlers(): void {
  ipcMain.on("clipboard:write", (_event, text: string) => {
    clipboard.writeText(text);
  });
}
