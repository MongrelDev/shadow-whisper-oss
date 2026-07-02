import type { AchievementKey, MilestoneKey } from "@whisper/api";
import { ensureOffscreenDocument } from "~/lib/offscreen-manager";
import {
  warmupSession,
  submitTranscription,
  fetchSessionRewards,
} from "~/lib/transcription/sw-pipeline";
import type { OffscreenOutboundMessage } from "~/lib/messaging/types";
import {
  clearPendingTranscription,
  readPendingTranscription,
  savePendingTranscription,
} from "~/lib/background/pending-transcription-store";
import { getBackgroundPrefs } from "~/lib/background/prefs";
import { getRecordingState, setRecordingState } from "~/lib/background/recording-state";
import {
  clearWarmedSessionId,
  readWarmedSessionId,
  saveWarmedSessionId,
} from "~/lib/background/warmup-store";
import {
  broadcastTranscriptError,
  broadcastTranscriptFinal,
  broadcastTranscriptStats,
} from "~/lib/background/transcript-broadcast";

function resolveForcedSkillId(): string | undefined {
  return getBackgroundPrefs().defaultSkillId ?? undefined;
}

export function kickoffWarmup(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const metadata = tab ? { tabUrl: tab.url ?? undefined } : undefined;
    warmupSession({ metadata })
      .then(({ sessionId }) => saveWarmedSessionId(sessionId))
      .catch(() => {
        void clearWarmedSessionId();
      });
  });
}

let toggleInFlight = false;

export function handleToggleRecording(): void {
  if (toggleInFlight) return;
  toggleInFlight = true;
  getRecordingState((current) => {
    if (current === "idle") {
      ensureOffscreenDocument()
        .then(() => chrome.runtime.sendMessage({ target: "offscreen", type: "offscreen:start" }))
        .then(() => {
          setRecordingState("recording");
          kickoffWarmup();
        })
        .catch(() => {
          setRecordingState("idle");
        })
        .finally(() => {
          toggleInFlight = false;
        });
    } else if (current === "recording") {
      chrome.runtime.sendMessage({ target: "offscreen", type: "offscreen:stop" });
      setRecordingState("processing");
      toggleInFlight = false;
    } else {
      toggleInFlight = false;
    }
  });
}

async function deliverSessionRewards(sessionId: string): Promise<void> {
  const rewards = await fetchSessionRewards(sessionId);
  if (!rewards) return;
  broadcastTranscriptStats(
    rewards.stats,
    rewards.unlockedAchievements as ReadonlyArray<AchievementKey> | undefined,
    rewards.unlockedMilestones as ReadonlyArray<MilestoneKey> | undefined
  );
}

async function runTranscribe(
  warmedSessionId: string,
  blob: Blob,
  mimeType: string,
  durationMs: number,
  skillId = resolveForcedSkillId()
): Promise<void> {
  const result = await submitTranscription({
    sessionId: warmedSessionId,
    blob,
    mimeType,
    durationMs,
    skillId,
  });
  broadcastTranscriptFinal(result.improvedText || result.rawText, durationMs);
  // Fire-and-forget: the rewards stream resolves after evaluation lands and
  // must not hold the recording state in "processing".
  void deliverSessionRewards(warmedSessionId);
}

async function handleChunkTranscription(
  bytes: number[],
  mimeType: string,
  durationMs: number
): Promise<void> {
  const warmedSessionId = await readWarmedSessionId();
  const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });
  try {
    if (!warmedSessionId)
      throw Object.assign(new Error("no warmed session"), { code: "warmup_missing" });
    const skillId = resolveForcedSkillId();
    await savePendingTranscription({
      sessionId: warmedSessionId,
      blob,
      mimeType,
      durationMs,
      ...(skillId ? { skillId } : {}),
      createdAt: Date.now(),
    }).catch(() => undefined);
    await runTranscribe(warmedSessionId, blob, mimeType, durationMs, skillId);
  } catch (err) {
    const code = (err as { code?: string }).code ?? "transcribe_failed";
    const message = err instanceof Error ? err.message : String(err);
    broadcastTranscriptError(code, message);
  } finally {
    await clearWarmedSessionId();
    await clearPendingTranscription().catch(() => {});
    setRecordingState("idle");
  }
}

export async function resumePendingTranscription(): Promise<void> {
  const pending = await readPendingTranscription().catch(() => undefined);
  if (!pending) return;

  setRecordingState("processing");
  try {
    await runTranscribe(
      pending.sessionId,
      pending.blob,
      pending.mimeType,
      pending.durationMs,
      pending.skillId
    );
  } catch (err) {
    const code = (err as { code?: string }).code ?? "transcribe_failed";
    const message = err instanceof Error ? err.message : String(err);
    broadcastTranscriptError(code, message);
  } finally {
    await clearWarmedSessionId();
    await clearPendingTranscription().catch(() => {});
    setRecordingState("idle");
  }
}

export function forwardChunkReady(
  msg: Extract<OffscreenOutboundMessage, { type: "offscreen:chunk-ready" }>
): void {
  void handleChunkTranscription(msg.bytes, msg.mimeType, msg.durationMs);
}

export function forwardError(
  msg: Extract<OffscreenOutboundMessage, { type: "offscreen:error" }>
): void {
  broadcastTranscriptError(msg.code, msg.message);
  setRecordingState("idle");
}
