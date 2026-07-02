import type { AchievementKey, MilestoneKey } from "@whisper/api";
import type { TranscribePiggybackStatsMessage } from "~/lib/messaging/types";
import { setLastTranscript, refreshContextMenu } from "~/lib/background/context-menu";

function buildEventId(
  stats: TranscribePiggybackStatsMessage | null,
  achievements: ReadonlyArray<string> | undefined,
  unlockedMilestones: ReadonlyArray<MilestoneKey> | undefined
): string {
  const ach = achievements ? achievements.join(",") : "";
  const today = stats ? stats.todayWordCount : 0;
  const ms = unlockedMilestones ? unlockedMilestones.join(",") : "";
  return `${Date.now()}:${today}:${ach}:${ms}`;
}

export function broadcastTranscriptFinal(text: string, durationMs: number): void {
  setLastTranscript(text);
  refreshContextMenu();
  chrome.runtime
    .sendMessage({ target: "sidepanel", type: "bg:transcript-final", text, durationMs })
    .catch(() => {});
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (tabId != null) {
      chrome.tabs
        .sendMessage(tabId, { target: "content", type: "bg:transcript-final", text, durationMs })
        .catch(() => {});
    }
  });
}

export function broadcastTranscriptStats(
  stats: TranscribePiggybackStatsMessage | null,
  achievements?: ReadonlyArray<AchievementKey>,
  unlockedMilestones?: ReadonlyArray<MilestoneKey>
): void {
  const eventId = buildEventId(stats, achievements, unlockedMilestones);
  const payloadCore = {
    type: "bg:transcript-stats" as const,
    stats,
    ...(achievements?.length ? { unlockedAchievements: achievements } : {}),
    ...(unlockedMilestones?.length ? { unlockedMilestones } : {}),
    eventId,
  };
  chrome.runtime.sendMessage({ target: "sidepanel", ...payloadCore }).catch(() => {});
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (tabId != null) {
      chrome.tabs.sendMessage(tabId, { target: "content", ...payloadCore }).catch(() => {});
    }
  });
}

export function broadcastTranscriptError(code: string, message: string): void {
  chrome.runtime
    .sendMessage({ target: "sidepanel", type: "bg:transcript-error", code, message })
    .catch(() => {});
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (tabId != null) {
      chrome.tabs
        .sendMessage(tabId, { target: "content", type: "bg:transcript-error", code, message })
        .catch(() => {});
    }
  });
}
