import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Clock } from "lucide-react";
import { m } from "~/paraglide/messages";
import type { DayCell } from "../types";
import { groupByPlatformOs, type PlatformGroup, type AppAggregate } from "../lib/aggregate";
import { formatThousands, formatDurationMin, formatDateLong } from "../../lib/format";

interface DayDetailModalProps {
  day: DayCell | null;
  onClose: () => void;
}

export function DayDetailModal({ day, onClose }: DayDetailModalProps) {
  const open = day !== null;
  return (
    <Dialog
      open={open}
      onOpenChange={(o: boolean) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-sm rounded-xl border-border/60 bg-card p-5">
        <DialogHeader className="space-y-0.5 text-left">
          <DialogTitle className="text-sm font-medium text-muted-foreground">
            {day ? formatDateLong(day.localDate) : ""}
          </DialogTitle>
        </DialogHeader>
        {day && <DayDetailBody day={day} />}
      </DialogContent>
    </Dialog>
  );
}

function DayDetailBody({ day }: { day: DayCell }) {
  const groups = groupByPlatformOs(day.items);
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tabular-nums tracking-tight">
            {formatThousands(day.wordCount)}
          </span>
          <span className="text-sm font-medium text-muted-foreground">{m.stats_words()}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
          <Clock className="size-3" />
          <span>{formatDurationMin(day.durationMs)}</span>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{m.heatmap_tooltip_empty()}</p>
      ) : (
        <div className="space-y-2.5">
          {groups.map((group) => (
            <PlatformGroupRow key={`${group.platform}-${group.os}`} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlatformGroupRow({ group }: { group: PlatformGroup }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        <span>{`${group.platform} · ${group.os}`}</span>
        <span className="tabular-nums">{formatThousands(group.totalWordCount)}</span>
      </div>
      <div className="space-y-0.5">
        {group.apps.map((app) => (
          <AppRow key={app.hostName} app={app} />
        ))}
      </div>
    </div>
  );
}

function AppRow({ app }: { app: AppAggregate }) {
  const isOther = app.hostName === "other";
  return (
    <div className="flex items-center justify-between rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted/30">
      <span className="min-w-0 truncate" title={isOther ? m.heatmap_others_tooltip() : undefined}>
        {isOther ? m.heatmap_others() : app.hostName}
      </span>
      <span className="tabular-nums text-xs text-muted-foreground">
        {formatThousands(app.wordCount)}
      </span>
    </div>
  );
}
