import { useHeatmapState } from "../hooks/use-heatmap-state";
import { StatsStripContainer } from "../../stats/containers/stats-strip-container";
import { HeatmapGrid } from "../components/heatmap-grid";
import { ProgressBadgeCollection } from "./progress-badge-collection";
import type { UserStatsView } from "../../stats/types";

interface HeatmapSectionProps {
  stats: UserStatsView;
}

export function HeatmapSection({ stats }: HeatmapSectionProps) {
  const { hydrated } = useHeatmapState();
  if (!hydrated) return null;

  return (
    <section className="space-y-3 animate-in fade-in duration-500">
      <div className="space-y-2">
        <StatsStripContainer stats={stats} />
        <ProgressBadgeCollection stats={stats} />
      </div>
      <HeatmapGrid />
    </section>
  );
}
