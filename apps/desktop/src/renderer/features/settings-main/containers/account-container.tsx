import { useNavigate } from "@tanstack/react-router";
import { useAuthenticatedUser } from "@/hooks/use-auth-context";
import { useSubscriptionStatus } from "@/hooks/use-user";
import { usePortal } from "@/hooks/use-portal";
import { daysFromNow, formatPeriodEndDate } from "@/lib/date-utils";
import { m } from "~/paraglide/messages";
import { AccountSection } from "../components/account-section";
import type { DisplayStatus, Plan } from "../../../../shared/ipc-types";

type Subscription = ReturnType<typeof useSubscriptionStatus>["data"];

const DEFAULT_USAGE = { totalWords: 0, limit: 2000, spokenWords: 0, transformedWords: 0 };

function resolveDisplayStatus(subscription: Subscription): DisplayStatus {
  return subscription?.displayStatus ?? "free";
}

function resolvePlan(subscription: Subscription): Plan {
  return subscription?.plan ?? "free";
}

function resolveUsage(subscription: Subscription) {
  return subscription?.usage ?? DEFAULT_USAGE;
}

function resolvePeriodEndDate(
  displayStatus: DisplayStatus,
  currentPeriodEnd: number | null | undefined
): string | null {
  if (displayStatus !== "canceling") return null;
  return formatPeriodEndDate(currentPeriodEnd);
}

function buildAccountSectionProps(
  user: ReturnType<typeof useAuthenticatedUser>,
  subscription: Subscription
) {
  const displayStatus = resolveDisplayStatus(subscription);
  const currentPeriodEnd = subscription?.currentPeriodEnd;

  return {
    displayName: user.name ?? m.settings_account_default_name(),
    displayEmail: user.email,
    plan: resolvePlan(subscription),
    displayStatus,
    periodEndDate: resolvePeriodEndDate(displayStatus, currentPeriodEnd),
    usage: resolveUsage(subscription),
    daysUntilReset: daysFromNow(currentPeriodEnd),
  };
}

export function AccountContainer(): React.ReactElement {
  const user = useAuthenticatedUser();
  const { data: subscription, refetch, isFetching } = useSubscriptionStatus();
  const { openPortal, isPending: isPortalPending } = usePortal();
  const navigate = useNavigate();
  const sectionProps = buildAccountSectionProps(user, subscription);

  return (
    <AccountSection
      {...sectionProps}
      onUpgrade={() => navigate({ to: "/app/pricing" })}
      onPortal={() => void openPortal()}
      isPortalPending={isPortalPending}
      onVerify={() => void refetch()}
      isVerifying={isFetching}
    />
  );
}
