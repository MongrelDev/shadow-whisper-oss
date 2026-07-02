import { apiClient } from "~/lib/api-client";
import { getToken } from "~/lib/token-storage";

declare global {
  interface NavigatorUABrandVersion {
    brand: string;
    version: string;
  }
  interface Navigator {
    userAgentData?: { brands: NavigatorUABrandVersion[] };
  }
}

export interface WarmupSessionInput {
  metadata?: { tabUrl?: string };
}

export interface WarmupSessionResult {
  sessionId: string;
}

export interface SubmitTranscriptionInput {
  sessionId: string;
  blob: Blob;
  mimeType: string;
  durationMs: number;
  skillId?: string;
}

export interface TranscribePiggybackStats {
  todayWordCount: number;
  weekWordCount: number;
  currentStreak: number;
  wpm: number;
  totalWords: number;
  weeklyAvgWpm: number;
  isFirstWeek: boolean;
}

export interface SubmitTranscriptionResult {
  rawText: string;
  improvedText: string;
  durationMs: number;
}

export interface SessionRewardsResult {
  stats: TranscribePiggybackStats;
  unlockedAchievements?: ReadonlyArray<string>;
  unlockedMilestones?: ReadonlyArray<string>;
}

function makeCodedError(message: string, code: string): Error & { code: string } {
  return Object.assign(new Error(message), { code });
}

function audioFilename(mimeType: string): string {
  if (mimeType.includes("wav")) return "audio.wav";
  if (mimeType.includes("ogg")) return "audio.ogg";
  return "audio.webm";
}

function detectBrowserBundleId(): string {
  const brands = navigator.userAgentData?.brands ?? [];
  const brandNames = new Set(brands.map((b) => b.brand));
  if (brandNames.has("Brave")) return "com.brave.Browser";
  if (brandNames.has("Microsoft Edge")) return "com.microsoft.Edge";
  if (brandNames.has("Google Chrome")) return "com.google.Chrome";
  return "browser";
}

function bundleIdToBrowserOs(bundleId: string): "chrome" | "brave" | "edge" | "browser" {
  switch (bundleId) {
    case "com.brave.Browser":
      return "brave";
    case "com.microsoft.Edge":
      return "edge";
    case "com.google.Chrome":
      return "chrome";
    default:
      return "browser";
  }
}

function buildClientDimensions(): {
  timezone: string;
  language: string;
  platform: "extension";
  os: "chrome" | "brave" | "edge" | "browser";
  surfaceContext: "other";
} {
  let timezone = "UTC";
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  } catch {
    timezone = "UTC";
  }
  return {
    timezone,
    language: chrome.i18n.getUILanguage() ?? "",
    platform: "extension" as const,
    os: bundleIdToBrowserOs(detectBrowserBundleId()),
    surfaceContext: "other" as const,
  };
}

function extractHostname(tabUrl: string | undefined): string | null {
  if (!tabUrl || !tabUrl.startsWith("http")) return null;
  try {
    return new URL(tabUrl).hostname;
  } catch {
    return null;
  }
}

function buildWarmupMetadata(input: WarmupSessionInput): {
  metadata: {
    surface: "extension";
    bundleId: string;
    activeTabHost?: string;
    browser: string;
    language: string;
    timezone: string;
    platform: string;
    os: string;
  };
} {
  const bundleId = detectBrowserBundleId();
  const dims = buildClientDimensions();
  const host = extractHostname(input.metadata?.tabUrl);
  const metadata: {
    surface: "extension";
    bundleId: string;
    activeTabHost?: string;
    browser: string;
    language: string;
    timezone: string;
    platform: string;
    os: string;
  } = {
    surface: "extension",
    bundleId,
    browser: dims.os,
    language: dims.language,
    timezone: dims.timezone,
    platform: dims.platform,
    os: dims.os,
  };
  if (host) metadata.activeTabHost = host;
  return { metadata };
}

async function parseWarmupResponse(res: Response): Promise<WarmupSessionResult> {
  if (res.status === 401) throw makeCodedError("unauthenticated", "unauthenticated");
  if (!res.ok) throw makeCodedError(`warmup HTTP ${res.status}`, "warmup_failed");
  const data = await res.json();
  return { sessionId: data.sessionId };
}

export async function warmupSession(input: WarmupSessionInput): Promise<WarmupSessionResult> {
  const body = buildWarmupMetadata(input);
  const res = await apiClient.api.sessions.warmup.$post({ json: body });
  return parseWarmupResponse(res);
}

function buildTranscribeUrl(sessionId: string): string {
  return `${import.meta.env.VITE_API_URL}/api/sessions/${encodeURIComponent(sessionId)}/transcribe`;
}

interface TranscribeResponseJson {
  rawText: string;
  improvedText: string;
  durationMs: number;
}

function buildTranscribeResult(
  data: TranscribeResponseJson,
  fallbackDurationMs: number
): SubmitTranscriptionResult {
  return {
    rawText: data.rawText ?? "",
    improvedText: data.improvedText ?? "",
    durationMs: data.durationMs ?? fallbackDurationMs,
  };
}

function classifyTranscribeStatus(status: number): string {
  if (status === 401) return "unauthenticated";
  if (status === 402) return "quota_exceeded";
  if (status === 413) return "payload_too_large";
  if (status === 429) return "rate_limited";
  return "transcribe_failed";
}

async function parseTranscribeResponse(
  res: Response,
  fallbackDurationMs: number
): Promise<SubmitTranscriptionResult> {
  if (!res.ok) {
    throw makeCodedError(`transcribe HTTP ${res.status}`, classifyTranscribeStatus(res.status));
  }
  const data = (await res.json()) as TranscribeResponseJson;
  return buildTranscribeResult(data, fallbackDurationMs);
}

export async function submitTranscription(
  input: SubmitTranscriptionInput
): Promise<SubmitTranscriptionResult> {
  const token = await getToken();
  if (!token) throw makeCodedError("unauthenticated", "unauthenticated");

  const form = new FormData();
  form.append("audio", input.blob, audioFilename(input.mimeType));
  if (input.skillId) form.append("skillId", input.skillId);

  const dims = buildClientDimensions();
  form.append("timezone", dims.timezone);
  form.append("language", dims.language);
  form.append("platform", dims.platform);
  form.append("os", dims.os);
  form.append("surfaceContext", dims.surfaceContext);

  const res = await fetch(buildTranscribeUrl(input.sessionId), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  return parseTranscribeResponse(res, input.durationMs);
}

function buildEventsUrl(sessionId: string): string {
  return `${import.meta.env.VITE_API_URL}/api/sessions/${encodeURIComponent(sessionId)}/events`;
}

function parseRewardsData(lines: ReadonlyArray<string>): SessionRewardsResult | null {
  const data = lines.find((line) => line.startsWith("data: "))?.slice("data: ".length);
  if (!data) return null;
  try {
    const parsed = JSON.parse(data) as Partial<SessionRewardsResult>;
    return parsed.stats ? (parsed as SessionRewardsResult) : null;
  } catch {
    return null;
  }
}

function parseRewardsEvent(sseText: string): SessionRewardsResult | null {
  for (const block of sseText.split("\n\n")) {
    const lines = block.split("\n");
    if (lines.some((line) => line.trim() === "event: rewards")) {
      return parseRewardsData(lines);
    }
  }
  return null;
}

// One-shot SSE read: the worker emits the rewards event once async evaluation
// lands, then closes the stream. Best-effort — a failure only costs the toast.
export async function fetchSessionRewards(sessionId: string): Promise<SessionRewardsResult | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetch(buildEventsUrl(sessionId), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return parseRewardsEvent(await res.text());
  } catch {
    return null;
  }
}
