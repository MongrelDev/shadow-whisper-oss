import { Flame, Zap, FileText } from "lucide-react";
import { m } from "~/paraglide/messages";
import { formatThousands, formatWpm } from "../../lib/format";

interface StatsStripProps {
  currentStreak: number;
  weeklyAvgWpm: number;
  totalWords: number;
  isFirstWeek: boolean;
}

export function StatsStrip({
  currentStreak,
  weeklyAvgWpm,
  totalWords,
  isFirstWeek,
}: StatsStripProps) {
  return (
    <div className="flex items-end justify-between rounded-lg border border-border/60 bg-card px-5 py-4">
      <div className="flex items-baseline gap-3">
        <div className="flex items-center gap-2">
          <Flame className="size-5 text-primary" />
          <span className="text-3xl font-bold tabular-nums leading-none tracking-tight">
            {currentStreak}
          </span>
        </div>
        <span className="text-sm text-muted-foreground/70">
          {isFirstWeek ? m.stats_streak_first_label() : m.stats_streak_label()}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground/60">
          <Zap className="size-3.5" />
          <span className="font-medium tabular-nums">{formatWpm(weeklyAvgWpm)}</span>
          <span className="text-muted-foreground/40">WPM</span>
        </div>
        <div className="h-3 w-px bg-border/50" aria-hidden />
        <div className="flex items-center gap-1.5 text-muted-foreground/60">
          <FileText className="size-3.5" />
          <span className="font-medium tabular-nums">{formatThousands(totalWords)}</span>
          <span className="text-muted-foreground/40">{m.stats_words()}</span>
        </div>
      </div>
    </div>
  );
}
