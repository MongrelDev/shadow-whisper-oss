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
    <div className="flex items-stretch gap-px overflow-hidden rounded-lg border border-border/60 bg-border/30">
      <Kpi
        icon={<Flame className="size-3.5 text-orange-500" />}
        value={currentStreak}
        suffix={currentStreak === 1 ? m.stats_day() : m.stats_days()}
        label={isFirstWeek ? m.stats_streak_first_label() : m.stats_streak_label()}
      />
      <Kpi
        icon={<Zap className="size-3.5 text-amber-400" />}
        value={formatWpm(weeklyAvgWpm)}
        suffix="WPM"
        label={isFirstWeek ? m.stats_wpm_first_label() : m.stats_wpm_label()}
      />
      <Kpi
        icon={<FileText className="size-3.5 text-muted-foreground/60" />}
        value={formatThousands(totalWords)}
        suffix={m.stats_words()}
        label={m.stats_total_label()}
      />
    </div>
  );
}

interface KpiProps {
  icon: React.ReactNode;
  value: string | number;
  suffix: string;
  label: string;
}

function Kpi({ icon, value, suffix, label }: KpiProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 bg-card px-2 py-2.5">
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-sm font-semibold tabular-nums leading-none text-foreground">
          {value}
        </span>
        <span className="text-[10px] text-muted-foreground/60">{suffix}</span>
      </div>
      <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">
        {label}
      </span>
    </div>
  );
}
