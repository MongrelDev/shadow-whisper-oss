import { useEffect } from "react";
import { useTranscribeStatsSync } from "./use-transcribe-stats-sync";

export function useSessionRewardsSync(): void {
  const syncStats = useTranscribeStatsSync();
  useEffect(
    () =>
      window.api.session.onRewards((payload) =>
        syncStats({
          stats: payload.stats,
          unlockedAchievements: payload.unlockedAchievements,
          unlockedMilestones: payload.unlockedMilestones,
        })
      ),
    [syncStats]
  );
}
