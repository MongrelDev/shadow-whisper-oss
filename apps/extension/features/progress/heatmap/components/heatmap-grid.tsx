import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useHeatmapData } from "../hooks/use-heatmap-data";
import { useHeatmapState } from "../hooks/use-heatmap-state";
import { HeatmapCell } from "./heatmap-cell";
import { DayTooltip } from "./day-tooltip";
import { DayDetailModal } from "./day-detail-modal";
import { m } from "~/paraglide/messages";
import type { DayCell } from "../types";

const DAY_LETTERS = () => [
  m.heatmap_day_sun(),
  m.heatmap_day_mon(),
  m.heatmap_day_tue(),
  m.heatmap_day_wed(),
  m.heatmap_day_thu(),
  m.heatmap_day_fri(),
  m.heatmap_day_sat(),
];

function formatWeekRange(cells: (DayCell | null)[]): string {
  const filled = cells.filter((c): c is DayCell => c !== null);
  const first = filled.at(0);
  const last = filled.at(-1);
  if (!first || !last) return "";
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(new Date(`${first.localDate}T00:00:00Z`))} – ${fmt(new Date(`${last.localDate}T00:00:00Z`))}`;
}

export function HeatmapGrid() {
  const { weeks, achievementDates, isError, isLoading } = useHeatmapData();
  const { state, update } = useHeatmapState();
  const [hovered, setHovered] = useState<DayCell | null>(null);
  const [selected, setSelected] = useState<DayCell | null>(null);

  if (isError) return null;
  if (isLoading) return <div className="h-20" aria-busy />;
  if (weeks.length === 0) return <div className="h-20" aria-busy />;

  const weekOffset = Math.floor(state.scrollOffsetDays / 7);
  const weekIndex = Math.max(0, Math.min(weeks.length - 1 - weekOffset, weeks.length - 1));
  const currentWeek = weeks[weekIndex];
  if (!currentWeek) return null;

  const canGoBack = weekOffset < weeks.length - 1;
  const canGoForward = weekOffset > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous week"
          disabled={!canGoBack}
          onClick={() => update({ scrollOffsetDays: (weekOffset + 1) * 7 })}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-25"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-[11px] font-medium text-muted-foreground">
          {formatWeekRange(currentWeek.cells)}
        </span>
        <button
          type="button"
          aria-label="Next week"
          disabled={!canGoForward}
          onClick={() => update({ scrollOffsetDays: Math.max(0, (weekOffset - 1) * 7) })}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-25"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_LETTERS().map((letter, i) => (
          <div
            key={i}
            className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/30"
          >
            {letter}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Usage heatmap">
        {currentWeek.cells.map((day, i) => (
          <DayCellSlot
            key={day?.localDate ?? i}
            day={day}
            hasAchievement={day !== null && achievementDates.has(day.localDate)}
            isHovered={day !== null && hovered?.localDate === day.localDate}
            onDayClick={setSelected}
            onHoverChange={setHovered}
          />
        ))}
      </div>

      <DayDetailModal day={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

interface DayCellSlotProps {
  day: DayCell | null;
  hasAchievement: boolean;
  isHovered: boolean;
  onDayClick?: (day: DayCell) => void;
  onHoverChange: (day: DayCell | null) => void;
}

function DayCellSlot({
  day,
  hasAchievement,
  isHovered,
  onDayClick,
  onHoverChange,
}: DayCellSlotProps) {
  const cell = (
    <HeatmapCell
      day={day}
      hasAchievement={hasAchievement}
      onClick={onDayClick}
      onMouseEnter={(d) => onHoverChange(d)}
      onMouseLeave={() => onHoverChange(null)}
    />
  );
  if (day && isHovered) {
    return (
      <DayTooltip
        day={day}
        trigger={cell}
        open
        onOpenChange={(o) => {
          if (!o) onHoverChange(null);
        }}
      />
    );
  }
  return cell;
}
