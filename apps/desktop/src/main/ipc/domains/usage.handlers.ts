import { ipcMain } from "electron";
import { typedRequest } from "../api-client";

export function setupUsageHandlers(): void {
  ipcMain.handle("usage:getDaily", (_e, query: { from: string; to: string }) =>
    typedRequest((c) => c.api.usage.daily.$get({ query }))
  );

  ipcMain.handle("usage:getStats", () => typedRequest((c) => c.api.usage.stats.$get()));

  ipcMain.handle("usage:getShareCardStats", () =>
    typedRequest((c) => c.api.usage["share-card"].$get())
  );
}
