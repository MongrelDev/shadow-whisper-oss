import type { AchievementItem } from "@whisper/api";
import { m } from "~/paraglide/messages";
import { cn } from "@/lib/utils";
import {
  BADGE_META,
  TIER_LABELS,
  TIER_COLORS,
  getBadgeTitle,
  getBadgeDesc,
  type BadgeKey,
  type BadgeTier,
} from "../lib/badges";

interface BadgeCardProps {
  achievement: AchievementItem;
}

export function BadgeCard({ achievement }: BadgeCardProps) {
  const key = achievement.key as BadgeKey;
  const meta = BADGE_META[key];
  if (!meta) return null;

  const { Icon, tier, rarity } = meta;
  const tierColor = TIER_COLORS[tier];
  const isLocked = achievement.earnedAt === null;

  return (
    <div className={cn("flex items-start gap-3.5 py-3.5", isLocked && "opacity-60")}>
      <BadgeIcon Icon={Icon} tierColor={tierColor} isLocked={isLocked} />

      <div className="min-w-0 flex-1">
        <BadgeTitle title={getBadgeTitle(key)} isLocked={isLocked} />
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground/70">
          {getBadgeDesc(key)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <RarityChip tier={tier} rarity={rarity} tierColor={tierColor} />
      </div>

      <div className="w-24 shrink-0 text-right">
        <BadgeStatus achievement={achievement} isLocked={isLocked} />
        {isLocked && achievement.progress && (
          <ProgressBar progress={achievement.progress} tierColor={tierColor} />
        )}
      </div>
    </div>
  );
}

function BadgeIcon({
  Icon,
  tierColor,
  isLocked,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  tierColor: { fg: string; bg: string; border: string };
  isLocked: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border",
        isLocked
          ? "border-border/50 text-muted-foreground/40"
          : cn(tierColor.bg, tierColor.border, tierColor.fg)
      )}
    >
      <Icon className="size-4" aria-hidden />
    </div>
  );
}

function BadgeTitle({ title, isLocked }: { title: string; isLocked: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn("text-[13px] font-medium leading-tight", isLocked && "text-muted-foreground")}
      >
        {title}
      </span>
    </div>
  );
}

function RarityChip({
  tier,
  rarity,
  tierColor,
}: {
  tier: BadgeTier;
  rarity: number;
  tierColor: { fg: string; dot: string };
}) {
  return (
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
  );
}

function BadgeStatus({
  achievement,
  isLocked,
}: {
  achievement: AchievementItem;
  isLocked: boolean;
}) {
  if (!isLocked) {
    return (
      <span className="font-mono text-[10px] tracking-wide text-muted-foreground">
        {formatEarnedDate(achievement.earnedAt)}
      </span>
    );
  }

  if (achievement.progress) {
    return (
      <div>
        <div className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
          {achievement.progress.current.toLocaleString()}/
          {achievement.progress.target.toLocaleString()}
        </div>
        <div className="font-mono text-[9px] text-muted-foreground/40">
          {achievement.progress.label} · {m.badge_locked()}
        </div>
      </div>
    );
  }

  return (
    <span className="font-mono text-[9px] tracking-wide text-muted-foreground/40">
      {m.badge_locked()}
    </span>
  );
}

function ProgressBar({
  progress,
  tierColor,
}: {
  progress: NonNullable<AchievementItem["progress"]>;
  tierColor: { dot: string };
}) {
  const pct = Math.min(100, Math.round((progress.current / progress.target) * 100));
  return (
    <div className="mt-1.5 h-[3px] w-full rounded-full bg-muted/80">
      <div className={cn("h-[3px] rounded-full", tierColor.dot)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function formatEarnedDate(ts: number | null): string {
  if (ts === null) return "";
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
