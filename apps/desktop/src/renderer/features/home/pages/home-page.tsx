import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useHistory } from "@/hooks/use-history";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { useSubscriptionStatus } from "@/hooks/use-user";
import { HomeTourMount } from "~/features/home-tour/containers/home-tour-mount";
import { PendingSuggestionsPanel } from "~/features/feedback/containers/pending-suggestions-panel";
import { useUserStats } from "~/features/progress/stats/hooks/use-user-stats";
import { HeatmapSection } from "~/features/progress/heatmap/containers/heatmap-section";
import { EmptyHome } from "~/features/progress/stats/components/empty-home";
import { BadgeCollection } from "~/features/progress/collection/components/badge-collection";
import { PlanStatusHeaderContainer } from "../containers/plan-status-header-container";
import { RecordingCardContainer } from "../containers/recording-card-container";
import { TranscriptionItemContainer } from "../containers/transcription-item-container";
import { HistoryList } from "../components/history-list";
import { HomeTopbar } from "../components/home-topbar";
import { UpsellBanner } from "../components/upsell-banner";
import { ProfileBadgeModal } from "../modals/profile-badge-modal";
import { NotificationsModal } from "../modals/notifications-modal";
import { ShortcutsModal } from "../modals/shortcuts-modal";
import type { UserStatsView } from "~/features/progress/stats/types";

function achievementLabel(stats: UserStatsView): string {
  const unlocked = stats.achievements.filter((a) => a.earnedAt !== null).length;
  return `${unlocked}/${stats.achievements.length}`;
}

function ProgressSection({
  stats,
  isPending,
}: {
  stats: UserStatsView | undefined;
  isPending: boolean;
}) {
  if (isPending || !stats) return null;
  return stats.hasAnyEntries ? <HeatmapSection /> : <EmptyHome />;
}

function AchievementsModal({
  stats,
  open,
  onOpenChange,
}: {
  stats: UserStatsView | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!stats) return null;
  return (
    <BadgeCollection
      open={open}
      onOpenChange={onOpenChange}
      achievements={stats.achievements}
      milestones={stats.milestones ?? []}
    />
  );
}

function PlanAndRecordingRow({
  stats,
  isFreePlan,
  onOpenPricing,
}: {
  stats: UserStatsView | undefined;
  isFreePlan: boolean;
  onOpenPricing: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <PlanStatusHeaderContainer
          currentStreak={stats?.currentStreak ?? 0}
          weeklyAvgWpm={stats?.weeklyAvgWpm ?? 0}
        />
        {isFreePlan && <UpsellBanner onAction={onOpenPricing} />}
      </div>
      <RecordingCardContainer />
    </div>
  );
}

export function HomePage(): React.ReactElement {
  const history = useHistory(50);
  const { shortcuts } = useShortcuts();
  const { data: subscription } = useSubscriptionStatus();
  const { data: stats, isPending: statsPending } = useUserStats();
  const navigate = useNavigate();
  const [badgesOpen, setBadgesOpen] = useState(false);

  const openShortcuts = () => navigate({ to: "/app", search: { modal: "shortcuts" } });
  const openPricing = () => navigate({ to: "/app/pricing" });

  return (
    <div className="space-y-6">
      <HomeTourMount />

      <HomeTopbar
        onOpenShortcuts={openShortcuts}
        achievementLabel={stats ? achievementLabel(stats) : undefined}
        onOpenAchievements={() => setBadgesOpen(true)}
      />

      <PlanAndRecordingRow
        stats={stats}
        isFreePlan={subscription?.displayStatus === "free"}
        onOpenPricing={openPricing}
      />

      <ProgressSection stats={stats} isPending={statsPending} />
      <PendingSuggestionsPanel />

      <HistoryList
        history={history}
        isLoading={history === undefined}
        renderItem={(entry) => <TranscriptionItemContainer entry={entry} />}
        recordAccelerator={shortcuts?.transcription}
      />

      <AchievementsModal stats={stats} open={badgesOpen} onOpenChange={setBadgesOpen} />
      <ProfileBadgeModal />
      <NotificationsModal />
      <ShortcutsModal />
    </div>
  );
}
