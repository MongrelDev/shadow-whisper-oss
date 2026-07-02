import { useEffect } from "react";
import type { BadgeUnlockPayload } from "../../../../../shared/ipc-types";
import {
  showBadgeToasts,
  BADGE_TOAST_DURATION_MS,
  type ShowBadgeToastInput,
} from "../../achievements/lib/show-badge-toast";
import {
  showMilestoneToasts,
  MILESTONE_TOAST_DURATION_MS,
} from "../../milestones/lib/show-milestone-toast";
const BUFFER_MS = 500;

function buildBadgeInput(payload: BadgeUnlockPayload): ShowBadgeToastInput {
  return {
    eventId: payload.eventId,
    ...(payload.unlockedAchievements ? { achievements: payload.unlockedAchievements } : {}),
  };
}

function handleBadgeUnlock(payload: BadgeUnlockPayload): void {
  let maxDuration = 0;

  const badgeCount = showBadgeToasts(buildBadgeInput(payload));
  if (badgeCount > 0) maxDuration = BADGE_TOAST_DURATION_MS;

  if (payload.unlockedMilestones && payload.unlockedMilestones.length > 0) {
    showMilestoneToasts(payload.eventId, payload.unlockedMilestones);
    maxDuration = Math.max(maxDuration, MILESTONE_TOAST_DURATION_MS);
  }

  if (maxDuration > 0) {
    setTimeout(() => {
      window.api.recording.notifyCelebrationDone();
    }, maxDuration + BUFFER_MS);
  }
}

export function usePillBadgeUnlock(): void {
  useEffect(() => {
    const cleanup = window.api.recording.onBadgeUnlock(handleBadgeUnlock);
    return cleanup;
  }, []);
}
