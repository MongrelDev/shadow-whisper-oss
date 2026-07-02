import { ipcMain } from "electron";

export function setupDebugHandlers(): void {
  ipcMain.on("debug:log", (_event, ...args: unknown[]) => {
    console.log("[renderer]", ...args);
  });
}
