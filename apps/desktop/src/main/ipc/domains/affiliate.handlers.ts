import { ipcMain } from "electron";
import { typedRequest } from "../api-client";

export function setupAffiliateHandlers(): void {
  ipcMain.handle("affiliate:getStatus", () => typedRequest((c) => c.affiliate.status.$get()));

  ipcMain.handle("affiliate:getProfile", async () => {
    const result = await typedRequest((c) => c.affiliate.profile.$get());
    if (!result.success) return result;

    const inviteUrl = result.data.code
      ? new URL(`/sign-up?code=${encodeURIComponent(result.data.code)}`, __WEB_URL__).toString()
      : "";

    return {
      ...result,
      data: { ...result.data, inviteUrl },
    };
  });

  ipcMain.handle("affiliate:getDashboard", () => typedRequest((c) => c.affiliate.dashboard.$get()));
}
