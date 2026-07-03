import { ipcMain, Notification, clipboard } from "electron";
import type {
  ActionModeExecuteIpcInput,
  ActionModeExecuteIpcResult,
  ActionModeFailureReason,
} from "../../../shared/ipc-types";
import { authedFetch } from "../api-client";
import { getToken } from "../../lib/token-storage";
import { insertTextAtCursor, checkAccessibility } from "../../services/KeyboardService";
import { resolveActiveTabHost } from "../../services/active-tab-host";
import {
  consumeActionModeContext,
  type ActionModeContext,
} from "../../services/action-mode-context";
import { setIsActionModeRecording, unregisterCancelShortcut } from "../../services/HotkeyService";
import { getConfig } from "../../services/ConfigStore";
import {
  muteOtherAudioForRecording,
  restoreOtherAudioAfterRecording,
} from "../../services/AudioFocusService";
import { showPillWindow } from "../../windows/pill";
import { m } from "../../../renderer/paraglide/messages";

interface ActionModeErrorBody {
  error_code?: string;
  details?: { message?: string };
}

interface ActionModeSuccessBody {
  outputText?: string;
  instructionText?: string;
}

function deriveOs(): "macos" | "windows" | "linux" {
  switch (process.platform) {
    case "darwin":
      return "macos";
    case "win32":
      return "windows";
    default:
      return "linux";
  }
}

function classifyByCode(code: string | undefined): ActionModeFailureReason | null {
  if (code === "er_authentication") return "unauthenticated";
  if (code === "er_limit_exceeded") return "quota_exceeded";
  if (code === "er_rate_limit") return "rate_limited";
  return null;
}

function classifyByStatus(status: number): ActionModeFailureReason {
  if (status === 401) return "unauthenticated";
  if (status === 402) return "quota_exceeded";
  if (status === 413) return "payload_too_large";
  if (status === 429) return "rate_limited";
  if (status === 502) return "execution_failed";
  return "internal";
}

function notify(body: string): void {
  if (!Notification.isSupported()) return;
  new Notification({ title: "ShadowWhisper", body, silent: true }).show();
}

function finalizeRecordingState(): void {
  setIsActionModeRecording(false);
  unregisterCancelShortcut();
  void restoreOtherAudioAfterRecording().catch(() => undefined);
}

function failure(reason: ActionModeFailureReason, message?: string): ActionModeExecuteIpcResult {
  notify(m.action_mode_failed_notice());
  return { ok: false, reason, ...(message ? { message } : {}) };
}

async function classifyErrorResponse(response: Response): Promise<ActionModeExecuteIpcResult> {
  const body = (await response.json().catch(() => ({}))) as ActionModeErrorBody;
  const reason = classifyByCode(body.error_code) ?? classifyByStatus(response.status);
  return failure(reason, body.details?.message ?? `HTTP ${response.status}`);
}

function appendClientFields(form: FormData, input: ActionModeExecuteIpcInput): void {
  if (input.locale) form.append("locale", input.locale);
  form.append("timezone", input.timezone || "UTC");
  if (input.language) form.append("language", input.language);
  form.append("platform", "desktop");
  form.append("os", deriveOs());
}

async function appendContextFields(form: FormData, ctx: ActionModeContext | null): Promise<void> {
  if (ctx?.selectedText) form.append("selectedText", ctx.selectedText);
  if (!ctx?.bundleId) return;
  form.append("bundleId", ctx.bundleId);
  const siteHost = await resolveActiveTabHost(ctx.bundleId);
  if (siteHost) form.append("siteHost", siteHost);
}

async function buildExecuteForm(
  input: ActionModeExecuteIpcInput,
  ctx: ActionModeContext | null
): Promise<FormData> {
  const form = new FormData();
  const audioBlob = new Blob([input.audioBuffer], { type: input.contentType });
  form.append("audio", audioBlob, "audio.webm");
  appendClientFields(form, input);
  await appendContextFields(form, ctx);
  return form;
}

async function tryInsert(text: string, ctx: ActionModeContext | null): Promise<boolean> {
  try {
    const result = await insertTextAtCursor(text, {
      targetPid: ctx?.targetPid ?? null,
      targetWindowHandle: ctx?.targetWindowHandle ?? null,
    });
    return result === "Pasted";
  } catch {
    return false;
  }
}

async function insertActionOutput(
  text: string,
  ctx: ActionModeContext | null
): Promise<{ inserted: boolean; notice?: string }> {
  if (!checkAccessibility(false)) {
    clipboard.writeText(text);
    return { inserted: false, notice: m.notice_copied_accessibility_required() };
  }

  if (await tryInsert(text, ctx)) return { inserted: true };

  clipboard.writeText(text);
  showPillWindow();
  return { inserted: false, notice: m.share_copied() };
}

async function postExecuteForm(
  input: ActionModeExecuteIpcInput,
  ctx: ActionModeContext | null
): Promise<Response | ActionModeExecuteIpcResult> {
  try {
    const form = await buildExecuteForm(input, ctx);
    return await authedFetch(`${__WORKER_URL__}/api/action-mode/execute`, {
      method: "POST",
      body: form,
    });
  } catch (error) {
    return failure("network", error instanceof Error ? error.message : "Network error");
  }
}

async function buildSuccessResult(
  response: Response,
  ctx: ActionModeContext | null
): Promise<ActionModeExecuteIpcResult> {
  const body = (await response.json().catch(() => ({}))) as ActionModeSuccessBody;
  const outputText = body.outputText ?? "";
  if (!outputText) return failure("execution_failed", "empty_output");

  const { inserted, notice } = await insertActionOutput(outputText, ctx);
  return {
    ok: true,
    outputText,
    instructionText: body.instructionText ?? "",
    inserted,
    ...(notice ? { notice } : {}),
  };
}

async function executeActionMode(
  input: ActionModeExecuteIpcInput
): Promise<ActionModeExecuteIpcResult> {
  const ctx = consumeActionModeContext();
  finalizeRecordingState();

  if (!getToken()) return failure("unauthenticated");

  const posted = await postExecuteForm(input, ctx);
  if (!(posted instanceof Response)) return posted;
  if (!posted.ok) return classifyErrorResponse(posted);
  return buildSuccessResult(posted, ctx);
}

export function setupActionModeHandlers(): void {
  ipcMain.handle(
    "action-mode:execute",
    async (_event, input: ActionModeExecuteIpcInput): Promise<ActionModeExecuteIpcResult> =>
      executeActionMode(input)
  );

  ipcMain.on("action-mode:started", () => {
    void muteOtherAudioForRecording(getConfig().preferences.audio.shouldMuteAudio).catch(
      () => undefined
    );
  });

  ipcMain.on("action-mode:cancel", () => {
    consumeActionModeContext();
    finalizeRecordingState();
    showPillWindow();
  });
}
