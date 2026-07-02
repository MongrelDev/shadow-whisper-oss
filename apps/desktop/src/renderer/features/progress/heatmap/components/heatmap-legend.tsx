import { m } from "~/paraglide/messages";

export function HeatmapLegend() {
  return (
    <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground/60">
      <span>{m.heatmap_legend_less()}</span>
      <div className="flex gap-0.5">
        <div className="size-2.5 rounded-[2px] border border-border/20" />
        <div className="size-2.5 rounded-[2px] bg-heatmap-1" />
        <div className="size-2.5 rounded-[2px] bg-heatmap-2" />
        <div className="size-2.5 rounded-[2px] bg-heatmap-3" />
        <div className="size-2.5 rounded-[2px] bg-heatmap-4" />
      </div>
      <span>{m.heatmap_legend_more()}</span>
    </div>
  );
}
