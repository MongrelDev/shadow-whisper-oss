import { StatsStrip } from "../components/stats-strip";
import type { UserStatsView } from "../types";

interface StatsStripContainerProps {
  stats: UserStatsView;
}

export function StatsStripContainer({ stats }: StatsStripContainerProps) {
  return (
    <StatsStrip
      currentStreak={stats.currentStreak}
      weeklyAvgWpm={stats.weeklyAvgWpm}
      totalWords={stats.totalWords}
      isFirstWeek={stats.isFirstWeek}
    />
  );
}
