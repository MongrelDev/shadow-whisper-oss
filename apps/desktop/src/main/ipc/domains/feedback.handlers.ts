import { ipcMain } from "electron";
import type { ApiResult, PendingSuggestionsListResponse } from "@whisper/api";
import type { CleanupFeedbackPayload } from "../../../shared/ipc-types";
import { typedRequest, getApiClient } from "../api-client";

export function setupFeedbackHandlers(): void {
  ipcMain.handle(
    "suggestions:get-pending",
    async (): Promise<ApiResult<PendingSuggestionsListResponse>> => {
      return typedRequest((c) => c.suggestions.pending.$get());
    }
  );

  ipcMain.handle(
    "suggestions:accept",
    async (_event, id: string): Promise<ApiResult<{ success: true }>> => {
      return typedRequest((c) => c.suggestions[":id"].accept.$post({ param: { id } }));
    }
  );

  ipcMain.handle(
    "suggestions:reject",
    async (_event, id: string): Promise<ApiResult<{ success: true }>> => {
      return typedRequest((c) => c.suggestions[":id"].reject.$post({ param: { id } }));
    }
  );

  ipcMain.on("feedback:sendCleanupFeedback", (_event, payload: CleanupFeedbackPayload): void => {
    const fullPayload = {
      ...payload,
      platform: "desktop" as const,
      os: process.platform,
    };
    void getApiClient()
      .api.feedback.cleanup.$post({ json: fullPayload })
      .catch(() => {
        // fire-and-forget — silently discard errors
      });
  });
}
