import type { DayCell } from "../types";
import { getCellColor } from "../lib/palette";
import { cn } from "@/lib/utils";

type CellSize = "weekly" | "grid";

interface HeatmapCellProps {
  day: DayCell | null;
  size?: CellSize;
  hasAchievement?: boolean;
  onClick?: (day: DayCell) => void;
  onMouseEnter?: (day: DayCell, target: HTMLElement) => void;
  onMouseLeave?: () => void;
}

function getDayNumber(localDate: string): string {
  return String(Number(localDate.slice(8, 10)));
}

const emptyVariants: Record<CellSize, string> = {
  weekly: "aspect-square w-full rounded-lg border border-border/20 bg-muted/10",
  grid: "aspect-square w-full rounded-[3px] border border-border/20",
};

const cellVariants: Record<CellSize, string> = {
  weekly: "aspect-square w-full rounded-lg",
  grid: "aspect-square w-full rounded-[3px] border border-border/15",
};

const indicatorVariants: Record<CellSize, string> = {
  weekly:
    "absolute top-1 right-1 size-1.5 rounded-full bg-amber-400 shadow-[0_0_0_1px_var(--background)]",
  grid: "absolute -top-px -right-px size-1 rounded-full bg-amber-400 shadow-[0_0_0_1px_var(--background)]",
};

function FilledCell({
  day,
  size,
  hasAchievement,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: Required<Pick<HeatmapCellProps, "size" | "hasAchievement">> &
  Pick<HeatmapCellProps, "onClick" | "onMouseEnter" | "onMouseLeave"> & { day: DayCell }) {
  const hasWords = day.wordCount > 0;
  return (
    <button
      type="button"
      className={cn(
        "relative flex items-center justify-center transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        cellVariants[size],
        getCellColor(day.wordCount)
      )}
      onClick={() => hasWords && onClick?.(day)}
      onMouseEnter={(e) => onMouseEnter?.(day, e.currentTarget)}
      onMouseLeave={onMouseLeave}
      aria-label={`${day.localDate}: ${day.wordCount} words`}
    >
      {hasWords && size === "weekly" && (
        <span className="text-xs font-semibold tabular-nums leading-none text-white/70">
          {getDayNumber(day.localDate)}
        </span>
      )}
      {hasAchievement && <span className={indicatorVariants[size]} aria-hidden />}
    </button>
  );
}

export function HeatmapCell({
  day,
  size = "weekly",
  hasAchievement = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: HeatmapCellProps) {
  if (day === null) {
    return <div className={emptyVariants[size]} aria-hidden />;
  }

  return (
    <FilledCell
      day={day}
      size={size}
      hasAchievement={hasAchievement}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
}
