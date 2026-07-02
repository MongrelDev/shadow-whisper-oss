import { m } from "~/paraglide/messages";
import { useHistory } from "@/hooks/use-history";
import { useSubscriptionStatus } from "@/hooks/use-user";
import { daysFromNow, formatPeriodEndDate } from "@/lib/date-utils";
import { PlanStatusHeader } from "../components/plan-status-header";
import { formatCompactNumber, formatDuration } from "../utils/format";

const RESET_NOTE_PREFIX: Record<"active" | "free", string> = {
  active: m.home_plan_note_renew_prefix(),
  free: m.home_plan_note_reset_prefix(),
};

const FALLBACK_NOTE: Record<"active" | "free" | "canceled", string> = {
  active: m.home_plan_note_active(),
  free: m.home_plan_note_free(),
  canceled: m.home_plan_note_canceled(),
};

const STATUS_NOTE_RESOLVERS = {
  active: (daysUntilReset: number | null) =>
    resolveResetNote(daysUntilReset, RESET_NOTE_PREFIX.active) ?? FALLBACK_NOTE.active,
  canceling: (_daysUntilReset: number | null, periodEndDate: string | null) =>
    periodEndDate
      ? `${m.home_plan_note_canceling_prefix()} · ${periodEndDate}`
      : m.home_plan_note_canceling(),
  canceled: () => FALLBACK_NOTE.canceled,
  free: (daysUntilReset: number | null) =>
    resolveResetNote(daysUntilReset, RESET_NOTE_PREFIX.free) ?? FALLBACK_NOTE.free,
} as const;

function computeTotals(entries: { wordCount: number; durationSeconds: number }[]) {
  let totalWords = 0;
  let totalDuration = 0;

  for (const entry of entries) {
    totalWords += entry.wordCount ?? 0;
    totalDuration += entry.durationSeconds ?? 0;
  }

  return { totalWords, totalDuration };
}

function resolveResetNote(daysUntilReset: number | null, prefix: string): string | null {
  if (daysUntilReset == null || daysUntilReset < 0) return null;
  return `${prefix} · ${daysUntilReset}d`;
}

function buildMetrics(subscription: NonNullable<ReturnType<typeof useSubscriptionStatus>["data"]>) {
  const isLimited = subscription.plan === "free";
  const weekWords = subscription.usage.totalWords;
  const weekLimit = subscription.usage.limit;
  const weekUsage = isLimited
    ? `${formatCompactNumber(weekWords)}/${weekLimit.toLocaleString("pt-BR")}`
    : formatCompactNumber(weekWords);

  return {
    weekUsage,
    weekPercentage: isLimited && weekLimit > 0 ? (weekWords / weekLimit) * 100 : null,
  };
}

function buildHistoryMetrics(
  history: ReturnType<typeof useHistory>,
  subscription: NonNullable<ReturnType<typeof useSubscriptionStatus>["data"]>
) {
  const totals = computeTotals(history ?? []);
  const usage = buildMetrics(subscription);

  return {
    totalWords: formatCompactNumber(totals.totalWords),
    totalDuration: formatDuration(totals.totalDuration),
    weekUsage: usage.weekUsage,
    weekPercentage: usage.weekPercentage,
  };
}

function resolveStatusNote(
  displayStatus: string,
  daysUntilReset: number | null,
  periodEndDate: string | null
): string {
  if (displayStatus === "active") return STATUS_NOTE_RESOLVERS.active(daysUntilReset);
  if (displayStatus === "canceling")
    return STATUS_NOTE_RESOLVERS.canceling(daysUntilReset, periodEndDate);
  if (displayStatus === "canceled") return STATUS_NOTE_RESOLVERS.canceled();
  return STATUS_NOTE_RESOLVERS.free(daysUntilReset);
}

interface PlanStatusHeaderContainerProps {
  currentStreak: number;
  weeklyAvgWpm: number;
}

export function PlanStatusHeaderContainer({
  currentStreak,
  weeklyAvgWpm,
}: PlanStatusHeaderContainerProps): React.ReactElement | null {
  const history = useHistory(Number.MAX_SAFE_INTEGER);
  const { data: subscription } = useSubscriptionStatus();

  if (!subscription) return null;

  const displayStatus = subscription.displayStatus ?? "free";
  const metrics = buildHistoryMetrics(history, subscription);
  const periodEndDate =
    displayStatus === "canceling" ? formatPeriodEndDate(subscription.currentPeriodEnd) : null;
  const daysUntilReset = daysFromNow(subscription.currentPeriodEnd);

  return (
    <PlanStatusHeader.Layout
      {...metrics}
      currentStreak={currentStreak}
      weeklyAvgWpm={String(Math.round(weeklyAvgWpm))}
      status={displayStatus}
      note={resolveStatusNote(displayStatus, daysUntilReset, periodEndDate)}
    />
  );
}
