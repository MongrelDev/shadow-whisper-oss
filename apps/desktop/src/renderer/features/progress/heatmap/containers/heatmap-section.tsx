import { useHeatmapState } from "../hooks/use-heatmap-state";
import { HeatmapGrid } from "../components/heatmap-grid";
import { AnnualHeatmapGrid } from "../components/annual-heatmap-grid";

export function HeatmapSection() {
  const { hydrated } = useHeatmapState();
  if (!hydrated) return null;

  return (
    <section className="@container animate-in fade-in duration-500">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card p-4">
        <div className="block @md:hidden">
          <HeatmapGrid />
        </div>

        <div className="hidden @md:block">
          <AnnualHeatmapGrid />
        </div>
      </div>
    </section>
  );
}
