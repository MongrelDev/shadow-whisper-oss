import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { m } from "~/paraglide/messages";
import type { DayCell } from "../types";
import { aggregateByHost, topAppsWithOther } from "../lib/aggregate";
import { formatThousands, formatDurationMin, formatDateShort } from "../../lib/format";

interface DayTooltipProps {
  day: DayCell;
  trigger: React.ReactElement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DayTooltip({ day, trigger, open, onOpenChange }: DayTooltipProps) {
  const aggregates = aggregateByHost(day.items);
  const { top, other } = topAppsWithOther(aggregates, 3);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side="top" align="center" className="w-56 p-3 text-xs">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-medium">{formatDateShort(day.localDate)}</span>
          <span className="text-muted-foreground">
            {formatThousands(day.wordCount)} {m.stats_words()}
          </span>
        </div>
        {day.wordCount === 0 ? (
          <p className="text-muted-foreground">{m.heatmap_tooltip_empty()}</p>
        ) : (
          <ul className="space-y-1">
            {top.map((app) => (
              <li key={app.hostName} className="flex items-center justify-between">
                <span className="truncate text-foreground">{app.hostName}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatThousands(app.wordCount)}
                </span>
              </li>
            ))}
            {other && (
              <li className="flex items-center justify-between border-t border-border/50 pt-1">
                <span className="text-muted-foreground">{m.heatmap_others()}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatThousands(other.wordCount)}
                </span>
              </li>
            )}
          </ul>
        )}
        <div className="mt-2 text-[10px] text-muted-foreground">
          {formatDurationMin(day.durationMs)}
        </div>
      </PopoverContent>
    </Popover>
  );
}
