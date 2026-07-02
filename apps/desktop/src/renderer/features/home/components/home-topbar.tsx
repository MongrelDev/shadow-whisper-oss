import { Keyboard, Search, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { m } from "~/paraglide/messages";

interface HomeTopbarProps {
  onOpenShortcuts: () => void;
  achievementLabel?: string;
  onOpenAchievements?: () => void;
}

export function HomeTopbar({
  onOpenShortcuts,
  achievementLabel,
  onOpenAchievements,
}: HomeTopbarProps): React.ReactElement {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-9 flex-1 items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3",
          "text-muted-foreground/70 cursor-not-allowed"
        )}
        aria-disabled="true"
      >
        <Search className="size-4 shrink-0" strokeWidth={1.75} />
        <span className="truncate text-sm">{m.home_topbar_search_placeholder()}</span>
      </div>

      <div className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border/60 bg-card px-2.5">
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-emerald-500)_18%,transparent)]"
        />
        <span className="text-xs font-medium text-muted-foreground">
          {m.home_topbar_status_synced()}
        </span>
      </div>

      {achievementLabel && onOpenAchievements && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenAchievements}
          aria-label={m.badge_collection_trigger_label()}
          className="h-9 shrink-0 px-3 text-xs"
        >
          <Trophy className="size-3.5" strokeWidth={1.75} />
          {achievementLabel}
        </Button>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onOpenShortcuts}
        className="h-9 shrink-0 px-3 text-xs"
      >
        <Keyboard className="size-3.5" strokeWidth={1.75} />
        {m.home_topbar_shortcuts_button()}
      </Button>
    </div>
  );
}
