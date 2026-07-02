import { useAuth } from "~/hooks/use-auth";
import { HistoryList } from "~/features/history/components/history-list";
import { TempRecordButton } from "~/features/transcription/components/temp-record-button";
import { HeatmapSection } from "~/features/progress/heatmap/containers/heatmap-section";
import { EmptyHome } from "~/features/progress/stats/components/empty-home";
import { useUserStats } from "~/features/progress/stats/hooks/use-user-stats";
import { UpsellBanner } from "~/features/billing/components/upsell-banner";
import { useSubscriptionStatus } from "~/features/billing/hooks/use-subscription-status";
import { Skeleton } from "~/components/ui/skeleton";
import { m } from "~/paraglide/messages";

function HomeUpgradePrompt() {
  const { data: status } = useSubscriptionStatus();
  if (status?.displayStatus !== "free") return null;
  return <UpsellBanner />;
}

export function HomePage() {
  const { user } = useAuth();
  const { data: stats, isPending } = useUserStats();

  return (
    <div className="flex h-full flex-col">
      <header
        aria-label="Recording controls"
        className="sticky top-0 z-10 border-b border-border bg-background px-5 py-3 space-y-2"
      >
        {user && (
          <p className="text-xs text-muted-foreground">{m.home_greeting({ name: user.name })}</p>
        )}
        <TempRecordButton />
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {isPending ? (
          <div className="space-y-4">
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <Skeleton className="h-28 w-full rounded-xl" />
            <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-10 rounded" />
              </div>
              <div className="px-4 py-3">
                <Skeleton className="h-8 w-full rounded" />
              </div>
              <div className="divide-y divide-border/50">
                <div className="px-4 py-3">
                  <Skeleton className="h-4 w-full rounded" />
                </div>
                <div className="px-4 py-3">
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
                <div className="px-4 py-3">
                  <Skeleton className="h-4 w-5/6 rounded" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          stats && (stats.hasAnyEntries ? <HeatmapSection stats={stats} /> : <EmptyHome />)
        )}
        <HomeUpgradePrompt />
        <HistoryList />
      </main>
    </div>
  );
}
