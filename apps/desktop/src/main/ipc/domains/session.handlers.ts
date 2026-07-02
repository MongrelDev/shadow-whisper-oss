import { BrowserWindow, ipcMain } from "electron";
import type { AchievementKey, MilestoneKey } from "@whisper/api";
import type {
  SessionRewardsPushPayload,
  SurfaceContext,
  TranscribePiggybackStats,
  TranscribeSyncFailureReason,
  TranscribeSyncIpcInput,
  TranscribeSyncIpcResult,
  WarmupIpcResult,
} from "../../../shared/ipc-types";
import { authedFetch, typedRequest } from "../api-client";
import { getToken } from "../../lib/token-storage";
import { getFocusedAppContext } from "../../services/KeyboardService";
import { resolveActiveTabHost } from "../../services/active-tab-host";
import { setRecordingSessionId } from "../../services/recording-context";
import { sendPillBadgeUnlock } from "../../windows/pill";

type FailureReason = "quota_exceeded" | "unauthenticated" | "network" | "internal";

function classifyFailure(code: string | undefined): FailureReason {
  if (code === "er_limit_exceeded") return "quota_exceeded";
  if (code === "er_authentication") return "unauthenticated";
  if (code === undefined) return "network";
  return "internal";
}

interface TranscribeErrorBody {
  error?: string;
  error_code?: string;
  code?: string;
}

interface TranscribeSuccessBody {
  sessionId?: string;
  rawText?: string;
  improvedText?: string;
  sttEngine?: string;
  durationMs?: number;
}

interface SessionRewardsEventPayload {
  stats?: TranscribePiggybackStats;
  unlockedAchievements?: ReadonlyArray<AchievementKey>;
  unlockedMilestones?: ReadonlyArray<MilestoneKey>;
}

function classifyByCode(code: string | undefined): TranscribeSyncFailureReason | null {
  if (code === "er_authentication") return "unauthenticated";
  if (code === "er_limit_exceeded") return "quota_exceeded";
  return null;
}

function classifyByStatus(status: number): TranscribeSyncFailureReason {
  if (status === 401) return "unauthenticated";
  if (status === 402) return "quota_exceeded";
  if (status === 413) return "payload_too_large";
  if (status === 502) return "transcription_failed";
  return "internal";
}

function classifyTranscribeError(
  status: number,
  body: TranscribeErrorBody
): TranscribeSyncIpcResult {
  const code = body.error_code ?? body.code;
  const reason = classifyByCode(code) ?? classifyByStatus(status);
  return { ok: false, reason, message: body.error ?? `HTTP ${status}` };
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

function resolveSurfaceContext(value: SurfaceContext | null): SurfaceContext {
  return value ?? "other";
}

function buildTranscribeForm(input: TranscribeSyncIpcInput): FormData {
  const form = new FormData();
  const audioBlob = new Blob([input.audioBuffer], { type: input.contentType });
  form.append("audio", audioBlob, "audio.webm");
  // `locale` is the STT language hint; `language` is the UI locale used for analytics/badge copy.
  if (input.locale) form.append("locale", input.locale);
  form.append("timezone", input.timezone || "UTC");
  if (input.language) form.append("language", input.language);
  form.append("platform", input.platform);
  form.append("os", deriveOs());
  form.append("surfaceContext", resolveSurfaceContext(input.surfaceContext));
  return form;
}

function nonEmpty<T>(list: ReadonlyArray<T> | undefined): ReadonlyArray<T> | undefined {
  return list && list.length > 0 ? list : undefined;
}

function parseRewardsEvent(sseText: string): SessionRewardsEventPayload | null {
  for (const block of sseText.split("\n\n")) {
    const lines = block.split("\n");
    if (!lines.some((line) => line.trim() === "event: rewards")) continue;
    const data = lines.find((line) => line.startsWith("data: "))?.slice("data: ".length);
    if (!data) return null;
    try {
      return JSON.parse(data) as SessionRewardsEventPayload;
    } catch {
      return null;
    }
  }
  return null;
}

function broadcastSessionRewards(payload: SessionRewardsPushPayload): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send("session:rewards", payload);
  }
}

function dispatchSessionRewards(
  sessionId: string,
  stats: TranscribePiggybackStats,
  payload: SessionRewardsEventPayload
): void {
  const achievements = nonEmpty(payload.unlockedAchievements);
  const milestones = nonEmpty(payload.unlockedMilestones);
  if (achievements || milestones) {
    sendPillBadgeUnlock({
      eventId: `${sessionId}:rewards`,
      unlockedAchievements: achievements,
      unlockedMilestones: milestones,
    });
  }
  broadcastSessionRewards({
    stats,
    ...(achievements ? { unlockedAchievements: achievements } : {}),
    ...(milestones ? { unlockedMilestones: milestones } : {}),
  });
}

// Rewards are evaluated server-side after the transcript returns; this one-shot
// SSE read is best-effort — a failure only costs the celebration toast, never
// the transcription.
async function deliverSessionRewards(sessionId: string): Promise<void> {
  try {
    const url = `${__WORKER_URL__}/api/sessions/${encodeURIComponent(sessionId)}/events`;
    const response = await authedFetch(url, { method: "GET" });
    if (!response.ok) return;
    const payload = parseRewardsEvent(await response.text());
    if (!payload?.stats) return;
    dispatchSessionRewards(sessionId, payload.stats, payload);
  } catch {
    return;
  }
}

async function parseTranscribeSuccess(
  response: Response,
  fallbackSessionId: string
): Promise<TranscribeSyncIpcResult> {
  const body = (await response.json().catch(() => ({}))) as TranscribeSuccessBody;
  return {
    ok: true,
    sessionId: body.sessionId ?? fallbackSessionId,
    rawText: body.rawText ?? "",
    improvedText: body.improvedText ?? "",
    sttEngine: body.sttEngine ?? "",
    durationMs: body.durationMs ?? 0,
  };
}

async function parseTranscribeError(response: Response): Promise<TranscribeSyncIpcResult> {
  const body = (await response.json().catch(() => ({}))) as TranscribeErrorBody;
  return classifyTranscribeError(response.status, body);
}

async function transcribeSync(input: TranscribeSyncIpcInput): Promise<TranscribeSyncIpcResult> {
  if (!getToken()) return { ok: false, reason: "unauthenticated" };

  const url = `${__WORKER_URL__}/api/sessions/${encodeURIComponent(input.sessionId)}/transcribe`;
  try {
    const response = await authedFetch(url, { method: "POST", body: buildTranscribeForm(input) });
    if (!response.ok) return await parseTranscribeError(response);
    const result = await parseTranscribeSuccess(response, input.sessionId);
    void deliverSessionRewards(input.sessionId);
    return result;
  } catch (error) {
    return {
      ok: false,
      reason: "network",
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}

async function buildDesktopWarmupMetadata(): Promise<{
  metadata: {
    surface: "desktop";
    bundleId?: string;
    activeTabHost?: string;
    hostname?: string;
    platform: string;
    os: "macos" | "windows" | "linux";
    accessibilityTrusted?: boolean;
  };
}> {
  const appContext = getFocusedAppContext();
  const os = deriveOs();
  const metadata: {
    surface: "desktop";
    bundleId?: string;
    activeTabHost?: string;
    hostname?: string;
    platform: string;
    os: "macos" | "windows" | "linux";
    accessibilityTrusted?: boolean;
  } = {
    surface: "desktop",
    platform: process.platform,
    os,
  };
  if (appContext?.bundleId) {
    metadata.bundleId = appContext.bundleId;
    const host = await resolveActiveTabHost(appContext.bundleId);
    if (host) metadata.activeTabHost = host;
  }
  if (appContext?.accessibilityTrusted !== undefined) {
    metadata.accessibilityTrusted = appContext.accessibilityTrusted;
  }
  return { metadata };
}

async function warmupSession(): Promise<WarmupIpcResult> {
  if (!getToken()) return { ok: false, reason: "unauthenticated" };
  const body = await buildDesktopWarmupMetadata();
  const result = await typedRequest((c) => c.api.sessions.warmup.$post({ json: body }));
  if (result.success) {
    setRecordingSessionId(result.data.sessionId);
    return { ok: true, sessionId: result.data.sessionId };
  }
  return { ok: false, reason: classifyFailure(result.code) };
}

export function setupSessionHandlers(): void {
  ipcMain.handle("session:warmup", async (): Promise<WarmupIpcResult> => warmupSession());
  ipcMain.handle(
    "session:transcribe",
    async (_event, input: TranscribeSyncIpcInput): Promise<TranscribeSyncIpcResult> =>
      transcribeSync(input)
  );
}
