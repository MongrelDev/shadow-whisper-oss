import type { AchievementItem } from "@whisper/api";
import { m } from "~/paraglide/messages";
import { cn } from "~/lib/utils";
import { deriveSolidClass, deriveTintClass } from "../../lib/color-classes";
import { BADGE_META, getBadgeTitle, getBadgeDesc, type BadgeKey } from "../lib/badges";

interface BadgeCardProps {
  achievement: AchievementItem;
}

export function BadgeCard({ achievement }: BadgeCardProps) {
  const key = achievement.key as BadgeKey;
  const meta = BADGE_META[key];
  if (!meta) return null;

  const { Icon, color } = meta;
  const isLocked = achievement.earnedAt === null;

  return (
    <div className={getCardClass(color, isLocked)}>
      <div className={getIconWrapClass(color, isLocked)}>
        <Icon className={getIconClass(color, isLocked)} />
      </div>
      <span className={getTitleClass(isLocked)}>{getBadgeTitle(key)}</span>
      <p className={getDescriptionClass(isLocked)}>{getBadgeDesc(key)}</p>
      <BadgeFooter achievement={achievement} isLocked={isLocked} color={color} />
    </div>
  );
}

function getCardClass(color: string, isLocked: boolean): string {
  const unlockedBg = deriveTintClass(color);
  return cn(
    "flex flex-col items-center gap-1.5 rounded-xl px-3 py-3.5 text-center transition-all",
    isLocked ? "bg-muted/30" : cn("border border-border/60", unlockedBg)
  );
}

function getIconWrapClass(color: string, isLocked: boolean): string {
  return cn(
    "flex size-9 items-center justify-center rounded-full",
    isLocked ? "bg-muted/50" : cn("bg-background/80", deriveTintClass(color))
  );
}

function getIconClass(color: string, isLocked: boolean): string {
  return cn("size-[18px] transition-colors", isLocked ? "text-muted-foreground/50" : color);
}

function getTitleClass(isLocked: boolean): string {
  return cn("text-xs font-semibold leading-tight", isLocked && "text-muted-foreground/60");
}

function getDescriptionClass(isLocked: boolean): string {
  return cn(
    "text-[10px] leading-snug text-muted-foreground",
    isLocked && "text-muted-foreground/40"
  );
}

function BadgeFooter({
  achievement,
  isLocked,
  color,
}: {
  achievement: AchievementItem;
  isLocked: boolean;
  color: string;
}) {
  if (isLocked && achievement.progress) {
    return <ProgressBar progress={achievement.progress} color={color} />;
  }
  if (isLocked) {
    return (
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40">
        {m.badge_locked()}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-500">
      {formatEarnedAt(achievement.earnedAt)}
    </span>
  );
}

function ProgressBar({
  progress,
  color,
}: {
  progress: NonNullable<AchievementItem["progress"]>;
  color: string;
}) {
  const pct = Math.min(100, Math.round((progress.current / progress.target) * 100));
  return (
    <div className="w-full space-y-1">
      <div className="h-1 w-full rounded-full bg-muted/50">
        <div
          className={cn("h-1 rounded-full transition-all", deriveSolidClass(color))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground/60">
        {progress.current}/{progress.target}
      </span>
    </div>
  );
}

function formatEarnedAt(ts: number | null): string {
  if (ts === null) return "";
  const diffMs = Date.now() - ts;
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
