import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAuthenticatedUser } from "@/hooks/use-auth-context";
import { useHistory } from "@/hooks/use-history";
import { useSubscriptionStatus } from "@/hooks/use-user";
import { ProfileBadgeDialog } from "../components/profile-badge-modal";

type Subscription = ReturnType<typeof useSubscriptionStatus>["data"];

function resolveBadgePlan(subscription: Subscription): string {
  return subscription?.displayStatus ?? subscription?.plan ?? "free";
}

function resolveBadgeWordsThisWeek(subscription: Subscription): number {
  return subscription?.usage.totalWords ?? 0;
}

function computeTotals(entries: { wordCount: number; durationSeconds: number }[]) {
  let totalWords = 0;
  let totalDuration = 0;

  for (const entry of entries) {
    totalWords += entry.wordCount ?? 0;
    totalDuration += entry.durationSeconds ?? 0;
  }

  return { totalWords, totalDuration, totalTranscriptions: entries.length };
}

export function ProfileBadgeModal(): React.ReactElement {
  const user = useAuthenticatedUser();
  const history = useHistory(Number.MAX_SAFE_INTEGER);
  const { data: subscription } = useSubscriptionStatus();
  const search = useSearch({ from: "/app-shell/protected/app/" });
  const navigate = useNavigate();

  const isOpen = search.badge === "open";
  const totals = computeTotals(history ?? []);

  return (
    <ProfileBadgeDialog
      isOpen={isOpen}
      onClose={() => navigate({ to: "/app", search: {} })}
      userName={user.name}
      userEmail={user.email}
      plan={resolveBadgePlan(subscription)}
      totalWords={totals.totalWords}
      totalDuration={totals.totalDuration}
      totalTranscriptions={totals.totalTranscriptions}
      wordsThisWeek={resolveBadgeWordsThisWeek(subscription)}
    />
  );
}
