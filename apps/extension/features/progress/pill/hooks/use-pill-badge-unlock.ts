import { useEffect } from "react";
import type { AchievementKey } from "@whisper/api";
import {
  isTranscribeStatsContentMessage,
  type TranscribeStatsContentMessage,
} from "../../../../lib/messaging/types";
import { showBadgeToasts, type ShowBadgeToastInput } from "../../achievements/lib/show-badge-toast";
import { showMilestoneToasts } from "../../milestones/lib/show-milestone-toast";

function resolveAchievements(
  msg: TranscribeStatsContentMessage
): ReadonlyArray<AchievementKey> | undefined {
  const list = msg.unlockedAchievements;
  return list && list.length > 0 ? list : undefined;
}

function buildBadgeInput(msg: TranscribeStatsContentMessage): ShowBadgeToastInput | null {
  const achievements = resolveAchievements(msg);
  if (!achievements) return null;
  return {
    eventId: msg.eventId ?? String(Date.now()),
    achievements,
  };
}

function handleStatsMessage(msg: TranscribeStatsContentMessage): void {
  const badgeInput = buildBadgeInput(msg);
  if (badgeInput) showBadgeToasts(badgeInput);

  if (msg.unlockedMilestones && msg.unlockedMilestones.length > 0) {
    showMilestoneToasts(msg.eventId ?? String(Date.now()), msg.unlockedMilestones);
  }
}

export function usePillBadgeUnlock(): void {
  useEffect(() => {
    const listener = (msg: unknown): void => {
      if (!isTranscribeStatsContentMessage(msg)) return;
      handleStatsMessage(msg);
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);
}
