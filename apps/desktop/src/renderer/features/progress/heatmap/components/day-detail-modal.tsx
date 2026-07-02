import { Monitor, Puzzle, X, Info } from "lucide-react";
import { cva } from "class-variance-authority";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { m } from "~/paraglide/messages";
import type { DayCell } from "../types";
import { groupByPlatformOs, type PlatformGroup, type AppAggregate } from "../lib/aggregate";
import { formatThousands, formatDateLong } from "../../lib/format";

interface DayDetailModalProps {
  day: DayCell | null;
  onClose: () => void;
}

const PLATFORM_META: Record<string, { label: () => string; icon: typeof Monitor }> = {
  desktop: { label: () => m.day_detail_platform_desktop(), icon: Monitor },
  extension: { label: () => m.day_detail_platform_extension(), icon: Puzzle },
};

const appBadgeVariants = cva(
  "flex size-[22px] shrink-0 items-center justify-center rounded-md border font-mono text-[9.5px] tracking-wider",
  {
    variants: {
      variant: {
        default: "border-border bg-primary/10 text-primary/70",
        other: "border-border/40 bg-transparent text-muted-foreground/40",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const appBarVariants = cva("h-full rounded-full", {
  variants: {
    variant: {
      default: "bg-primary",
      other: "bg-muted-foreground/30",
    },
  },
  defaultVariants: { variant: "default" },
});

export function DayDetailModal({ day, onClose }: DayDetailModalProps) {
  const open = day !== null;
  return (
    <Dialog
      open={open}
      onOpenChange={(o: boolean) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        className="w-[calc(100%_-_1rem)] max-w-[520px] gap-0 overflow-hidden p-0"
        hideClose
      >
        <DialogDescription className="sr-only">{m.heatmap_achievement_on_day()}</DialogDescription>
        {day && <DayDetailContent day={day} />}
      </DialogContent>
    </Dialog>
  );
}

function DayDetailContent({ day }: { day: DayCell }) {
  const groups = groupByPlatformOs(day.items);
  const appCount = new Set(day.items.map((i) => i.hostName)).size;

  return (
    <>
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground/60">
              {formatThousands(day.wordCount)} {m.stats_words()} · {appCount} {m.day_detail_apps()}
            </p>
            <DialogTitle className="mt-1 text-base font-semibold">
              {formatDateLong(day.localDate)}
            </DialogTitle>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground
                transition-colors hover:bg-muted hover:text-foreground active:bg-muted"
            >
              <X className="size-4" aria-hidden />
              <span className="sr-only">{m.day_detail_close()}</span>
            </button>
          </DialogClose>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Body */}
      <div className="max-h-[24rem] overflow-y-auto px-5 py-4">
        <DayDetailBody groups={groups} totalDayWords={day.wordCount} />
      </div>
    </>
  );
}

function DayDetailBody({
  groups,
  totalDayWords,
}: {
  groups: PlatformGroup[];
  totalDayWords: number;
}) {
  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">{m.heatmap_tooltip_empty()}</p>;
  }
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <PlatformGroupSection
          key={`${group.platform}-${group.os}`}
          group={group}
          totalDayWords={totalDayWords}
        />
      ))}
    </div>
  );
}

function PlatformGroupSection({
  group,
  totalDayWords,
}: {
  group: PlatformGroup;
  totalDayWords: number;
}) {
  const meta = PLATFORM_META[group.platform];
  const PlatformIcon = meta?.icon ?? Monitor;

  return (
    <div>
      {/* Group header */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <PlatformIcon className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">{meta?.label() ?? group.platform}</span>
        <span className="font-mono text-[10px] tracking-wider text-muted-foreground/50">
          · {group.os}
        </span>
        <span className="flex-1" />
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {formatThousands(group.totalWordCount)}
        </span>
      </div>

      {/* App rows */}
      <div>
        {group.apps.map((app) => (
          <AppRow key={app.hostName} app={app} totalDayWords={totalDayWords} />
        ))}
      </div>
    </div>
  );
}

function AppBadge({ app, isOther }: { app: AppAggregate; isOther: boolean }) {
  return (
    <span className={appBadgeVariants({ variant: isOther ? "other" : "default" })}>
      {isOther ? "?" : app.hostName.charAt(0)}
    </span>
  );
}

function AppLabel({ app, isOther }: { app: AppAggregate; isOther: boolean }) {
  if (isOther) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="truncate text-[13px] italic text-muted-foreground">
          {m.heatmap_others()}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="size-3 shrink-0 cursor-help text-muted-foreground/40" />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">{m.heatmap_others_tooltip()}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }
  return (
    <>
      <span className="truncate text-[13px]">{app.hostName}</span>
      <span className="font-mono text-[9.5px] tracking-wider text-muted-foreground/50">
        {app.category}
      </span>
    </>
  );
}

function AppRow({ app, totalDayWords }: { app: AppAggregate; totalDayWords: number }) {
  const isOther = app.category === "uncategorized";
  const pct = totalDayWords > 0 ? Math.round((app.wordCount / totalDayWords) * 100) : 0;

  return (
    <div className="grid grid-cols-[1fr_80px_auto] items-center gap-3 py-2.5 pl-1">
      <div className="flex min-w-0 items-center gap-2.5">
        <AppBadge app={app} isOther={isOther} />
        <div className="min-w-0">
          <AppLabel app={app} isOther={isOther} />
        </div>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-muted/50">
        <div
          className={appBarVariants({ variant: isOther ? "other" : "default" })}
          style={{ width: `${pct}%` }}
        />
      </div>

      <span className="min-w-[5ch] text-right font-mono text-[11px] tabular-nums text-muted-foreground">
        {formatThousands(app.wordCount)}
      </span>
    </div>
  );
}
