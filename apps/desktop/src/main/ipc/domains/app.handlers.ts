import { ipcMain, app } from "electron";
import { showMainWindow, getMainWindow } from "../../windows/main";

export function setupAppHandlers(): void {
  ipcMain.handle("app:version", () => {
    return app.getVersion();
  });

  ipcMain.on("app:showMainWindow", () => {
    showMainWindow();
  });

  ipcMain.on("app:openRoute", (_event, route: string) => {
    showMainWindow();
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send("app:navigate", { route });
    }
  });
}
