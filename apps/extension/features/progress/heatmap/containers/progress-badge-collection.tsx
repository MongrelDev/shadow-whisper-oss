import { useState } from "react";
import { Trophy } from "lucide-react";
import { m } from "~/paraglide/messages";
import { BadgeCollection } from "../../collection/components/badge-collection";
import type { UserStatsView } from "../../stats/types";

interface ProgressBadgeCollectionProps {
  stats: UserStatsView;
}

export function ProgressBadgeCollection({ stats }: ProgressBadgeCollectionProps) {
  const [badgesOpen, setBadgesOpen] = useState(false);

  const unlockedCount = stats.achievements.filter((a) => a.earnedAt !== null).length;

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => setBadgesOpen(true)}
        aria-label={m.badge_collection_trigger_label()}
        className="flex items-center gap-1.5 rounded-md px-1 py-1 text-muted-foreground/60 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Trophy className="size-3.5" />
        <span className="text-[10px] font-medium tabular-nums">
          {unlockedCount}/{stats.achievements.length}
        </span>
      </button>
      <BadgeCollection
        open={badgesOpen}
        onOpenChange={setBadgesOpen}
        achievements={stats.achievements}
        milestones={stats.milestones ?? []}
      />
    </div>
  );
}
