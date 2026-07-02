import { ipcMain, shell } from "electron";

export function setupShellHandlers(): void {
  ipcMain.on("shell:openExternal", (_event, url: string) => {
    shell.openExternal(url);
  });
}
