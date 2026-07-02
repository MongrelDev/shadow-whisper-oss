import { m } from "~/paraglide/messages";
import { cn } from "@/lib/utils";
import type { MilestoneItem } from "@whisper/api";
import { MILESTONE_META, getMilestoneTitle, getMilestoneDesc } from "../lib/milestones";
import type { MilestoneKey } from "../lib/milestones";
import { TIER_LABELS, TIER_COLORS } from "../../achievements/lib/badges";

interface MilestoneCardProps {
  milestone: MilestoneItem;
}

export function MilestoneCard({ milestone }: MilestoneCardProps) {
  const key = milestone.key as MilestoneKey;
  const meta = MILESTONE_META[key];
  if (!meta) return null;

  const { Icon, color, tier, rarity } = meta;
  const tierColor = TIER_COLORS[tier];
  const isLocked = milestone.earnedAt === null;

  return (
    <div className={cn("flex items-start gap-3.5 py-3.5", isLocked && "opacity-60")}>
      <MilestoneIcon Icon={Icon} color={color} tierColor={tierColor} isLocked={isLocked} />

      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "text-[13px] font-medium leading-tight",
            isLocked && "text-muted-foreground"
          )}
        >
          {getMilestoneTitle(key)}
        </span>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground/70">
          {getMilestoneDesc(key)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", tierColor.dot)} />
            <span className={cn("font-mono text-[10px] tracking-wider", tierColor.fg)}>
              {TIER_LABELS[tier]}
            </span>
          </div>
          <span className="font-mono text-[9px] tracking-wide text-muted-foreground/50">
            {rarity}% têm
          </span>
        </div>
      </div>

      <div className="w-24 shrink-0 text-right">
        <MilestoneStatus earnedAt={milestone.earnedAt} />
      </div>
    </div>
  );
}

function MilestoneIcon({
  Icon,
  color,
  tierColor,
  isLocked,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  tierColor: { bg: string; border: string };
  isLocked: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border",
        isLocked
          ? "border-border/50 text-muted-foreground/40"
          : cn(tierColor.bg, tierColor.border, color)
      )}
    >
      <Icon className="size-4" aria-hidden />
    </div>
  );
}

function MilestoneStatus({ earnedAt }: { earnedAt: number | null }) {
  if (earnedAt !== null) {
    return (
      <span className="font-mono text-[10px] tracking-wide text-muted-foreground">
        {new Date(earnedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
      </span>
    );
  }
  return (
    <span className="font-mono text-[9px] tracking-wide text-muted-foreground/40">
      {m.badge_locked()}
    </span>
  );
}
