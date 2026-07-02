import { ipcMain } from "electron";
import {
  clearInteractionMode,
  getInteractionMode,
  setInteractionMode,
  type InteractionMode,
} from "../../services/InteractionModeService";

export function setupInteractionHandlers(): void {
  ipcMain.handle("interaction:getMode", async () => ({
    success: true,
    data: getInteractionMode(),
  }));

  ipcMain.handle("interaction:setMode", async (_event, mode: InteractionMode, owner?: string) => {
    setInteractionMode(mode, owner);
    return { success: true };
  });

  ipcMain.handle("interaction:clearMode", async (_event, owner?: string) => {
    clearInteractionMode(owner);
    return { success: true };
  });
}
