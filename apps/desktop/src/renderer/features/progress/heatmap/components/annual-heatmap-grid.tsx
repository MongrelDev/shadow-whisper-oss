import { useMemo, useState } from "react";
import { Flame } from "lucide-react";
import { m } from "~/paraglide/messages";
import { useHeatmapData } from "../hooks/use-heatmap-data";
import { useUserStats } from "../../stats/hooks/use-user-stats";
import { HeatmapCell } from "./heatmap-cell";
import { HeatmapLegend } from "./heatmap-legend";
import { DayTooltip } from "./day-tooltip";
import { DayDetailModal } from "./day-detail-modal";
import { formatThousands } from "../../lib/format";
import type { DayCell, HeatmapWeek } from "../types";

function computeWeekWords(weeks: HeatmapWeek[]): number {
  const lastWeek = weeks[weeks.length - 1];
  if (!lastWeek) return 0;
  return lastWeek.cells.reduce((sum, cell) => sum + (cell?.wordCount ?? 0), 0);
}

export function AnnualHeatmapGrid() {
  const { weeks, achievementDates, isError, isLoading } = useHeatmapData();
  const { data: stats } = useUserStats();
  const [hovered, setHovered] = useState<DayCell | null>(null);
  const [selected, setSelected] = useState<DayCell | null>(null);

  const weekWords = useMemo(() => computeWeekWords(weeks), [weeks]);

  if (isError) return null;
  if (isLoading) return <div className="h-20" aria-busy />;
  if (weeks.length === 0) return null;

  return (
    <div className="space-y-0">
      {/* Header: "Últimos 12 meses" + week word count */}
      <div className="mb-3 flex items-center gap-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {m.heatmap_last_12_months()}
        </span>
        <span className="h-px flex-1 bg-border/40" aria-hidden />
        <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground/50">
          {formatThousands(weekWords)} {m.heatmap_this_week()}
        </span>
      </div>

      {/* Grid cells */}
      <div className="flex gap-0.5">
        {weeks.map((week, colIdx) => (
          <div key={colIdx} className="flex flex-1 min-w-0 flex-col gap-0.5">
            {week.cells.map((day, rowIdx) => (
              <GridCellSlot
                key={day?.localDate ?? `${colIdx}-${rowIdx}`}
                day={day}
                hasAchievement={day !== null && achievementDates.has(day.localDate)}
                isHovered={day !== null && hovered?.localDate === day.localDate}
                onDayClick={setSelected}
                onHoverChange={setHovered}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Footer: streak + achievement dot legend + heatmap legend */}
      <div className="mt-3 flex items-center gap-3.5">
        {stats && stats.currentStreak > 0 && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
            <Flame className="size-3.5 text-amber-500" />
            <b className="font-medium text-foreground">{stats.currentStreak}d</b>
            <span className="text-muted-foreground/50">· {m.heatmap_streak_dont_break()}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground/50">
          <span className="size-1.5 rounded-full bg-amber-400" aria-hidden />
          {m.heatmap_achievement_on_day()}
        </span>
        <span className="flex-1" />
        <HeatmapLegend />
      </div>

      <DayDetailModal day={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

interface GridCellSlotProps {
  day: DayCell | null;
  hasAchievement: boolean;
  isHovered: boolean;
  onDayClick?: (day: DayCell) => void;
  onHoverChange: (day: DayCell | null) => void;
}

function GridCellSlot({
  day,
  hasAchievement,
  isHovered,
  onDayClick,
  onHoverChange,
}: GridCellSlotProps) {
  const cell = (
    <HeatmapCell
      day={day}
      size="grid"
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
