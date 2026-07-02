import { toast } from "sonner";
import type { AchievementKey } from "@whisper/api";
import { BADGE_META, type BadgeKey } from "./badges";
import { getCelebrationSubtitle, getCelebrationTitle } from "./celebration-copy";

export const BADGE_TOAST_DURATION_MS = 3000;
const MAX_TOASTS = 3;

export interface ShowBadgeToastInput {
  eventId: string;
  achievements?: ReadonlyArray<AchievementKey>;
}

function showAchievementToast(eventId: string, key: AchievementKey): void {
  const id = `${eventId}:${key}`;
  const Icon = BADGE_META[key as BadgeKey]?.Icon;
  const title = getCelebrationTitle(key);
  const subtitle = getCelebrationSubtitle(key);
  toast.custom(() => <BadgeToastContent title={title} subtitle={subtitle} Icon={Icon} />, {
    id,
    duration: BADGE_TOAST_DURATION_MS,
  });
}

export function showBadgeToasts(input: ShowBadgeToastInput): number {
  let count = 0;

  for (const key of input.achievements ?? []) {
    if (count >= MAX_TOASTS) break;
    showAchievementToast(input.eventId, key);
    count++;
  }

  return count;
}

function BadgeToastContent({
  title,
  subtitle,
  Icon,
}: {
  title: string;
  subtitle: string;
  Icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border/60 bg-card px-4 py-3 shadow-lg">
      {Icon ? <Icon className="size-5 shrink-0 text-primary" aria-hidden /> : null}
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold text-foreground">{title}</span>
        {subtitle ? (
          <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
}
