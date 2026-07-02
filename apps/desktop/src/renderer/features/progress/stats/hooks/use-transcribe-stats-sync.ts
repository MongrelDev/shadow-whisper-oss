import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AchievementKey, AchievementItem, MilestoneKey, MilestoneItem } from "@whisper/api";
import type { TranscribePiggybackStats } from "../../../../../shared/ipc-types";
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

function mergeMilestones(
  prev: ReadonlyArray<MilestoneItem>,
  unlocked: ReadonlyArray<MilestoneKey>,
  now: number
): ReadonlyArray<MilestoneItem> {
  if (unlocked.length === 0) return prev;
  const unlockedSet = new Set<string>(unlocked);
  return prev.map((item) =>
    unlockedSet.has(item.key) && item.earnedAt === null ? { ...item, earnedAt: now } : item
  );
}

export interface TranscribeStatsPayload {
  stats: TranscribePiggybackStats;
  unlockedAchievements?: ReadonlyArray<AchievementKey>;
  unlockedMilestones?: ReadonlyArray<MilestoneKey>;
}

export function useTranscribeStatsSync() {
  const queryClient = useQueryClient();

  return useCallback(
    ({ stats, unlockedAchievements, unlockedMilestones }: TranscribeStatsPayload) => {
      const unlocked = unlockedAchievements ?? [];
      const milestonesUnlocked = unlockedMilestones ?? [];
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
          milestones: mergeMilestones(prev.milestones, milestonesUnlocked, now),
        };
      });
    },
    [queryClient]
  );
}
