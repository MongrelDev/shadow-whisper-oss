import { ipcMain } from "electron";
import { getConfig, setConfig, resetConfig, type AppConfigPatch } from "../../services/ConfigStore";

export function setupConfigHandlers(): void {
  ipcMain.handle("config:get", async () => {
    return { success: true, data: getConfig() };
  });

  ipcMain.handle("config:set", async (_event, patch: AppConfigPatch) => {
    try {
      setConfig(patch);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });

  ipcMain.handle("config:reset", async () => {
    try {
      resetConfig();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });
}
