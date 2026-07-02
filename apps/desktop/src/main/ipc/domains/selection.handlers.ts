import { ipcMain } from "electron";
import { getSelectedText } from "../../services/KeyboardService";

export function setupSelectionHandlers(): void {
  ipcMain.handle("selection:getSelectedText", async () => {
    return getSelectedText();
  });
}
