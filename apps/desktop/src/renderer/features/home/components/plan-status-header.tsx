import { cva } from "class-variance-authority";
import { m } from "~/paraglide/messages";
import { cn } from "@/lib/utils";
import type { DisplayStatus } from "../../../../shared/ipc-types";

const dotVariants = cva("size-1.5 rounded-full", {
  variants: {
    status: {
      free: "bg-muted-foreground/50",
      active:
        "bg-primary shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-primary)_18%,transparent)]",
      canceling: "bg-amber-500/80",
      canceled: "bg-muted-foreground/40",
    },
  },
});

const progressVariants = cva("h-full rounded-full transition-[width] duration-500 ease-out", {
  variants: {
    threshold: {
      normal: "bg-primary",
      warning: "bg-amber-500",
      critical: "bg-destructive",
    },
  },
});

export interface PlanStatusHeaderProps {
  totalWords: string;
  totalDuration: string;
  weekUsage: string;
  weekPercentage: number | null;
  currentStreak: number;
  weeklyAvgWpm: string;
}

interface PlanStatusHeaderShellProps {
  children: React.ReactNode;
}

interface PlanStatusHeaderLayoutProps extends PlanStatusHeaderProps {
  status: DisplayStatus;
  note: string;
}

function resolveThreshold(percentage: number): "normal" | "warning" | "critical" {
  if (percentage >= 100) return "critical";
  if (percentage >= 80) return "warning";
  return "normal";
}

function MetricCell({
  value,
  label,
  border = false,
}: {
  value: string;
  label: string;
  border?: boolean;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col justify-center px-4 py-3",
        border && "border-l border-border/50"
      )}
    >
      <p className="text-[15px] font-semibold leading-none tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-1.5 font-mono text-[10px] uppercase leading-none tracking-[0.2em] text-muted-foreground/70">
        {label}
      </p>
    </div>
  );
}

function Shell({ children }: PlanStatusHeaderShellProps): React.ReactElement {
  return (
    <article className="relative" data-tour="home-status">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-2 -z-10 rounded-xl bg-primary/[0.03] blur-xl"
      />
      <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-[0_16px_40px_-28px_color-mix(in_oklch,var(--color-primary)_25%,black)]">
        {children}
      </div>
    </article>
  );
}

function Top({ status, note }: { status: DisplayStatus; note: string }): React.ReactElement {
  const planLabel = {
    free: m.home_plan_label_free(),
    active: m.home_plan_label_active(),
    canceling: m.home_plan_label_canceling(),
    canceled: m.home_plan_label_canceled(),
  }[status];
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {m.home_plan_title()}
        </p>
        <span className="h-3 w-px bg-border" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <span className={cn(dotVariants({ status }))} aria-hidden="true" />
          <span className="text-sm font-semibold tracking-tight text-foreground">{planLabel}</span>
        </div>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
        {note}
      </p>
    </header>
  );
}

function Metrics({
  currentStreak,
  weeklyAvgWpm,
  totalWords,
  totalDuration,
  weekUsage,
}: Pick<
  PlanStatusHeaderLayoutProps,
  "currentStreak" | "weeklyAvgWpm" | "totalWords" | "totalDuration" | "weekUsage"
>) {
  return (
    <div>
      <div className="grid grid-cols-3">
        <MetricCell value={String(currentStreak)} label={m.home_plan_streak_label()} />
        <MetricCell value={weeklyAvgWpm} label="WPM" border />
        <MetricCell value={totalWords} label={m.home_plan_words_label()} border />
      </div>
      <div className="grid grid-cols-2 border-t border-border/50">
        <MetricCell value={totalDuration} label={m.home_plan_duration_label()} />
        <MetricCell value={weekUsage} label={m.home_plan_week_label()} border />
      </div>
    </div>
  );
}

function Meter({
  weekPercentage,
}: Pick<PlanStatusHeaderProps, "weekPercentage">): React.ReactElement | null {
  if (weekPercentage == null) return null;

  const clampedPercentage = weekPercentage == null ? 0 : Math.min(Math.max(weekPercentage, 0), 100);
  const threshold = resolveThreshold(clampedPercentage);
  const displayPercentage =
    weekPercentage == null
      ? ""
      : weekPercentage < 1 && weekPercentage > 0
        ? "<1%"
        : `${Math.round(weekPercentage)}%`;

  return (
    <div className="flex items-center gap-3 border-t border-border/50 bg-muted/20 px-4 py-2.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
        {m.home_plan_usage_label()}
      </span>
      <div
        className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-muted/70"
        role="progressbar"
        aria-valuenow={clampedPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(progressVariants({ threshold }))}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      <span className="font-mono text-[11px] tabular-nums tracking-tight text-muted-foreground">
        {displayPercentage}
      </span>
    </div>
  );
}

function Layout({
  status,
  note,
  currentStreak,
  weeklyAvgWpm,
  totalWords,
  totalDuration,
  weekUsage,
  weekPercentage,
}: PlanStatusHeaderLayoutProps): React.ReactElement {
  return (
    <Shell>
      <Top status={status} note={note} />
      <Metrics
        currentStreak={currentStreak}
        weeklyAvgWpm={weeklyAvgWpm}
        totalWords={totalWords}
        totalDuration={totalDuration}
        weekUsage={weekUsage}
      />
      <Meter weekPercentage={weekPercentage} />
    </Shell>
  );
}

export const PlanStatusHeader = {
  Layout,
};
