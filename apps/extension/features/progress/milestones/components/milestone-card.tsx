import type { MilestoneItem } from "@whisper/api";
import { m } from "~/paraglide/messages";
import { cn } from "~/lib/utils";
import { deriveTintClass } from "../../lib/color-classes";
import { MILESTONE_META, getMilestoneTitle, getMilestoneDesc } from "../lib/milestones";
import type { MilestoneKey } from "../lib/milestones";

interface MilestoneCardProps {
  milestone: MilestoneItem;
}

function MilestoneIcon({
  Icon,
  color,
  isLocked,
  bg,
}: {
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  color: string;
  isLocked: boolean;
  bg: string;
}) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        isLocked ? "bg-muted/50" : cn("bg-background/80", bg)
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          "size-[18px] transition-colors",
          isLocked ? "text-muted-foreground/50" : color
        )}
      />
    </div>
  );
}

export function MilestoneCard({ milestone }: MilestoneCardProps) {
  const key = milestone.key as MilestoneKey;
  const meta = MILESTONE_META[key];
  if (!meta) return null;

  const { Icon, color, threshold } = meta;
  const isLocked = milestone.earnedAt === null;
  const formattedThreshold = new Intl.NumberFormat(navigator.language).format(threshold);
  const bg = deriveTintClass(color);

  return (
    <div className={cn("flex items-start gap-4 py-4", !isLocked && "relative")}>
      <MilestoneIcon Icon={Icon} color={color} isLocked={isLocked} bg={bg} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span
            className={cn(
              "truncate text-sm font-semibold leading-none",
              isLocked && "text-muted-foreground"
            )}
          >
            {getMilestoneTitle(key)}
          </span>
          <MilestoneStatus milestone={milestone} isLocked={isLocked} />
        </div>
        <p
          className={cn(
            "mt-1 text-xs",
            isLocked ? "text-muted-foreground/60" : "text-muted-foreground"
          )}
        >
          {getMilestoneDesc(key) || `${formattedThreshold} words`}
        </p>
      </div>
    </div>
  );
}

function MilestoneStatus({ milestone, isLocked }: { milestone: MilestoneItem; isLocked: boolean }) {
  if (!isLocked && milestone.earnedAt !== null) {
    return (
      <span className="shrink-0 text-xs text-emerald-500">
        {new Date(milestone.earnedAt).toLocaleDateString()}
      </span>
    );
  }
  return (
    <span className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground/50">
      {m.badge_locked()}
    </span>
  );
}
