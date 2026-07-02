import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AchievementKey } from "@whisper/api";
import { isTranscribeStatsSidepanelMessage } from "../../../../lib/messaging/types";
import type { AchievementItem } from "@whisper/api";
import type { UserStatsView } from "../types";
import { USAGE_STATS_QUERY_KEY } from "./use-user-stats";

function mergeAchievements(
  prev: ReadonlyArray<AchievementItem>,
  unlocked: ReadonlyArray<AchievementKey>,
  now: number
): ReadonlyArray<AchievementItem> {
  if (unlocked.length === 0) return prev;
  const unlockedSet = new Set<string>(unlocked);
  return prev.map((item) =>
    unlockedSet.has(item.key) && item.earnedAt === null
      ? { ...item, earnedAt: now, progress: undefined }
      : item
  );
}

export function useTranscribeStatsSync(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const listener = (msg: unknown) => {
      if (!isTranscribeStatsSidepanelMessage(msg)) return;
      if (!msg.stats) {
        queryClient.invalidateQueries({ queryKey: USAGE_STATS_QUERY_KEY });
        return;
      }
      const stats = msg.stats;
      const unlocked = msg.unlockedAchievements ?? [];
      const now = Date.now();
      queryClient.setQueryData<UserStatsView>(USAGE_STATS_QUERY_KEY, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentStreak: stats.currentStreak,
          weeklyAvgWpm: stats.weeklyAvgWpm,
          totalWords: stats.totalWords,
          isFirstWeek: stats.isFirstWeek,
          hasAnyEntries: true,
          achievements: mergeAchievements(prev.achievements, unlocked, now),
        };
      });
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [queryClient]);
}
