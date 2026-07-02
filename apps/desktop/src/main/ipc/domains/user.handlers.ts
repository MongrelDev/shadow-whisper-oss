import { ipcMain } from "electron";
import { typedRequest } from "../api-client";

export function setupUserHandlers(): void {
  ipcMain.handle("user:getSubscriptionStatus", () => typedRequest((c) => c.billing.status.$get()));

  ipcMain.handle("user:getPlans", () => typedRequest((c) => c.billing.plans.$get()));
}
