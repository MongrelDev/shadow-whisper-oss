import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { AchievementItem, MilestoneItem } from "@whisper/api";
import { m } from "~/paraglide/messages";
import { BADGE_CATEGORIES } from "../../achievements/lib/badges";
import { MILESTONE_ORDER } from "../../milestones/lib/milestones";
import { BadgeCard } from "../../achievements/components/badge-card";
import { MilestoneCard } from "../../milestones/components/milestone-card";

const messages = m as unknown as Record<string, () => string>;

function getBadgeTabMilestones(): string {
  const fn = messages["badge_tab_milestones"];
  return fn ? fn() : "Milestones";
}

interface BadgeCollectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  achievements: ReadonlyArray<AchievementItem>;
  milestones: ReadonlyArray<MilestoneItem>;
}

interface BadgeTabTriggerProps {
  label: string;
  value: string;
  keys: readonly string[];
  byKey: ReadonlyMap<string, AchievementItem>;
}

function BadgeTabTrigger({ label, value, keys, byKey }: BadgeTabTriggerProps) {
  const unlocked = keys.filter((k) => byKey.get(k)?.earnedAt !== null).length;
  return (
    <TabsTrigger value={value} className="rounded-full px-3 py-1 text-xs">
      {label} {unlocked}/{keys.length}
    </TabsTrigger>
  );
}

interface MilestoneTabTriggerProps {
  label: string;
  milestones: ReadonlyArray<MilestoneItem>;
}

function MilestoneTabTrigger({ label, milestones }: MilestoneTabTriggerProps) {
  const unlocked = milestones.filter((m) => m.earnedAt !== null).length;
  return (
    <TabsTrigger value="milestones" className="rounded-full px-3 py-1 text-xs">
      {label} {unlocked}/{MILESTONE_ORDER.length}
    </TabsTrigger>
  );
}

export function BadgeCollection({
  open,
  onOpenChange,
  achievements,
  milestones,
}: BadgeCollectionProps) {
  const byKey = new Map<string, AchievementItem>();
  for (const a of achievements) byKey.set(a.key, a);

  const milestoneByKey = new Map<string, MilestoneItem>();
  for (const ms of milestones) milestoneByKey.set(ms.key, ms);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-xl border-border/60 bg-card p-5">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-base font-bold tracking-tight">
            {m.badge_collection_title()}
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="habit">
          <TabsList className="rounded-full bg-muted p-1">
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
            <MilestoneTabTrigger label={getBadgeTabMilestones()} milestones={milestones} />
          </TabsList>
          <TabsContent value="habit">
            <div className="grid grid-cols-2 gap-2.5">
              {BADGE_CATEGORIES.habit.map((key) => {
                const item = byKey.get(key) ?? { key, earnedAt: null, contextJson: null };
                return <BadgeCard key={key} achievement={item} />;
              })}
            </div>
          </TabsContent>
          <TabsContent value="progress">
            <div className="grid grid-cols-2 gap-2.5">
              {BADGE_CATEGORIES.progress.map((key) => {
                const item = byKey.get(key) ?? { key, earnedAt: null, contextJson: null };
                return <BadgeCard key={key} achievement={item} />;
              })}
            </div>
          </TabsContent>
          <TabsContent value="discovery">
            <div className="grid grid-cols-2 gap-2.5">
              {BADGE_CATEGORIES.discovery.map((key) => {
                const item = byKey.get(key) ?? { key, earnedAt: null, contextJson: null };
                return <BadgeCard key={key} achievement={item} />;
              })}
            </div>
          </TabsContent>
          <TabsContent value="milestones">
            <div className="h-96 overflow-y-auto divide-y divide-border/40">
              {MILESTONE_ORDER.map((key) => {
                const item = milestoneByKey.get(key) ?? { key, earnedAt: null, contextJson: null };
                return <MilestoneCard key={key} milestone={item} />;
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
