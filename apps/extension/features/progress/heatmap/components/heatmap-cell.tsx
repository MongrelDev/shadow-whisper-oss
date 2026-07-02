import type { DayCell } from "../types";
import { getCellColor } from "../lib/palette";
import { cn } from "~/lib/utils";

interface HeatmapCellProps {
  day: DayCell | null;
  hasAchievement?: boolean;
  onClick?: (day: DayCell) => void;
  onMouseEnter?: (day: DayCell, target: HTMLElement) => void;
  onMouseLeave?: () => void;
}

function getDayNumber(localDate: string): string {
  return String(Number(localDate.slice(8, 10)));
}

export function HeatmapCell({
  day,
  hasAchievement = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: HeatmapCellProps) {
  if (day === null) {
    return (
      <div
        className="aspect-square w-full rounded-lg bg-muted/10 border border-border/20"
        aria-hidden
      />
    );
  }

  const hasWords = day.wordCount > 0;

  return (
    <button
      type="button"
      className={cn(
        "relative flex aspect-square w-full items-center justify-center rounded-lg transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        getCellColor(day.wordCount)
      )}
      onClick={() => onClick?.(day)}
      onMouseEnter={(e) => onMouseEnter?.(day, e.currentTarget)}
      onMouseLeave={onMouseLeave}
      aria-label={`${day.localDate}: ${day.wordCount} words`}
    >
      {hasWords && (
        <span className="text-[10px] font-semibold tabular-nums leading-none text-white/70">
          {getDayNumber(day.localDate)}
        </span>
      )}
      {hasAchievement && (
        <span
          className="absolute inset-x-1.5 bottom-1 h-0.5 rounded-full bg-amber-400/80"
          aria-hidden
        />
      )}
    </button>
  );
}
