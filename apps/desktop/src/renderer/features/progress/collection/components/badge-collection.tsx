import { useMemo, useState } from "react";
import { Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AchievementItem, MilestoneItem } from "@whisper/api";
import { m } from "~/paraglide/messages";
import { ShareCardModal } from "../../../share-cards/containers/share-card-modal";
import { BADGE_CATEGORIES } from "../../achievements/lib/badges";
import { MILESTONE_ORDER } from "../../milestones/lib/milestones";
import { BadgeCard } from "../../achievements/components/badge-card";
import { MilestoneCard } from "../../milestones/components/milestone-card";

interface BadgeCollectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  achievements: ReadonlyArray<AchievementItem>;
  milestones: ReadonlyArray<MilestoneItem>;
}

function BadgeTabTrigger({
  label,
  value,
  keys,
  byKey,
}: {
  label: string;
  value: string;
  keys: readonly string[];
  byKey: ReadonlyMap<string, AchievementItem>;
}) {
  const unlocked = keys.filter((k) => byKey.get(k)?.earnedAt !== null).length;
  return (
    <TabsTrigger value={value} className="whitespace-nowrap rounded-full px-2.5 py-1 text-xs">
      {label} {unlocked}/{keys.length}
    </TabsTrigger>
  );
}

function ColumnHeader() {
  return (
    <div className="flex items-center gap-3.5 border-b border-border/50 px-5 py-2">
      <span className="w-8 shrink-0" />
      <span className="flex-1 font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground/50">
        {m.badge_column_achievement()}
      </span>
      <span className="shrink-0 text-right font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground/50">
        {m.badge_column_rarity()}
      </span>
      <span className="w-24 shrink-0 text-right font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground/50">
        {m.badge_column_status()}
      </span>
    </div>
  );
}

function RarityFooter() {
  return (
    <p className="px-5 py-3 text-[11px] leading-relaxed text-muted-foreground/40">
      {m.badge_rarity_footer()}
    </p>
  );
}

function BadgeTabContent({
  keys,
  byKey,
}: {
  keys: readonly string[];
  byKey: ReadonlyMap<string, AchievementItem>;
}) {
  return (
    <div className="h-[28rem] overflow-y-auto">
      <ColumnHeader />
      <div className="divide-y divide-border/50 px-5">
        {keys.map((key) => {
          const item = byKey.get(key) ?? { key, earnedAt: null, contextJson: null };
          return <BadgeCard key={key} achievement={item} />;
        })}
      </div>
      <RarityFooter />
    </div>
  );
}

function MilestonesTabContent({
  milestonesByKey,
}: {
  milestonesByKey: ReadonlyMap<string, MilestoneItem>;
}) {
  return (
    <div className="h-[28rem] overflow-y-auto">
      <ColumnHeader />
      <div className="divide-y divide-border/50 px-5">
        {MILESTONE_ORDER.map((key) => {
          const item = milestonesByKey.get(key) ?? { key, earnedAt: null, contextJson: null };
          return <MilestoneCard key={key} milestone={item} />;
        })}
      </div>
      <RarityFooter />
    </div>
  );
}

export function BadgeCollection({
  open,
  onOpenChange,
  achievements,
  milestones,
}: BadgeCollectionProps) {
  const [shareOpen, setShareOpen] = useState(false);

  const byKey = useMemo(() => {
    const map = new Map<string, AchievementItem>();
    for (const a of achievements) map.set(a.key, a);
    return map;
  }, [achievements]);

  const milestonesByKey = useMemo(() => {
    const map = new Map<string, MilestoneItem>();
    for (const ms of milestones) map.set(ms.key, ms);
    return map;
  }, [milestones]);

  const unlockedCount = useMemo(
    () => achievements.filter((a) => a.earnedAt !== null).length,
    [achievements]
  );
  const unlockedMilestoneCount = useMemo(
    () => milestones.filter((ms) => ms.earnedAt !== null).length,
    [milestones]
  );

  const totalUnlocked = unlockedCount + unlockedMilestoneCount;
  const totalPossible = achievements.length + MILESTONE_ORDER.length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="mx-4 max-w-xl gap-0 overflow-hidden p-0 sm:mx-auto">
          <Tabs defaultValue="habit">
            <div className="px-5 pt-5 pb-0 pr-10">
              <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground/60">
                {totalUnlocked} {m.badge_collection_of()} {totalPossible} ·{" "}
                {m.badge_collection_sorted_rarity()}
              </p>
              <DialogTitle className="mt-1 text-base font-semibold">
                {m.badge_collection_title()}
              </DialogTitle>
            </div>
            <div className="px-5 pt-3 pb-0">
              <TabsList className="h-auto rounded-full bg-muted p-0.5">
                <BadgeTabTrigger
                  label={m.badge_tab_habit()}
                  value="habit"
                  keys={BADGE_CATEGORIES.habit}
                  byKey={byKey}
                />
                <BadgeTabTrigger
                  label={m.badge_tab_progress()}
                  value="progress"
                  keys={BADGE_CATEGORIES.progress}
                  byKey={byKey}
                />
                <BadgeTabTrigger
                  label={m.badge_tab_discovery()}
                  value="discovery"
                  keys={BADGE_CATEGORIES.discovery}
                  byKey={byKey}
                />
                <TabsTrigger
                  value="milestones"
                  className="whitespace-nowrap rounded-full px-2.5 py-1 text-xs"
                >
                  {m.badge_tab_milestones()} {unlockedMilestoneCount}/{MILESTONE_ORDER.length}
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="mt-3 border-t border-border" />
            <TabsContent value="habit" className="mt-0">
              <BadgeTabContent keys={BADGE_CATEGORIES.habit} byKey={byKey} />
            </TabsContent>
            <TabsContent value="progress" className="mt-0">
              <BadgeTabContent keys={BADGE_CATEGORIES.progress} byKey={byKey} />
            </TabsContent>
            <TabsContent value="discovery" className="mt-0">
              <BadgeTabContent keys={BADGE_CATEGORIES.discovery} byKey={byKey} />
            </TabsContent>
            <TabsContent value="milestones" className="mt-0">
              <MilestonesTabContent milestonesByKey={milestonesByKey} />
            </TabsContent>

            <div className="border-t border-border px-5 py-3">
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="flex min-h-9 w-full items-center justify-center gap-2 rounded-md border border-border
                  bg-background px-4 text-sm font-medium text-muted-foreground transition-colors
                  hover:bg-muted hover:text-foreground"
              >
                <Share2 className="size-4" aria-hidden />
                {m.badge_collection_share()}
              </button>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ShareCardModal open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}
