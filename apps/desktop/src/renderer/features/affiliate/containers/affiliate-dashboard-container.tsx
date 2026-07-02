import { Link } from "@tanstack/react-router";
import { CreditCard, RefreshCw } from "lucide-react";
import { m } from "~/paraglide/messages";
import { Button } from "@/components/ui/button";
import { useAffiliateProfile, useAffiliateDashboard } from "../hooks/use-affiliate";
import { InviteLinkCard } from "../components/invite-link-card";
import { AffiliateStats } from "../components/affiliate-stats";
import { ReferralList } from "../components/referral-list";

function LoadingSkeleton(): React.ReactElement {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 rounded-lg bg-muted/40" />
      <div className="h-20 rounded-lg bg-muted/40" />
      <div className="h-16 rounded-lg bg-muted/40" />
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }): React.ReactElement {
  return (
    <div className="rounded-lg border border-dashed border-destructive/30 p-12 text-center space-y-3">
      <p className="text-sm text-muted-foreground">{m.affiliate_load_error()}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="size-3.5 mr-1.5" />
        {m.affiliate_retry()}
      </Button>
    </div>
  );
}

function NotEligibleState({
  reason,
}: {
  reason: "missing_stripe_customer" | "missing_active_subscription" | null;
}): React.ReactElement {
  const description =
    reason === "missing_stripe_customer"
      ? m.affiliate_ineligible_reason_missing_customer()
      : m.affiliate_ineligible_reason_missing_subscription();

  return (
    <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-4">
      <CreditCard className="mx-auto size-5 text-muted-foreground" strokeWidth={1.5} />
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">{m.affiliate_ineligible_title()}</h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      <Button asChild size="sm">
        <Link to="/app/pricing">{m.affiliate_ineligible_cta()}</Link>
      </Button>
    </div>
  );
}

function shouldShowLoading(profileLoading: boolean, dashboardLoading: boolean): boolean {
  return profileLoading || dashboardLoading;
}

function shouldShowError(profileError: boolean, dashboardError: boolean): boolean {
  return profileError || dashboardError;
}

function renderDashboardContent(
  profile: NonNullable<ReturnType<typeof useAffiliateProfile>["data"]>,
  dashboard: ReturnType<typeof useAffiliateDashboard>["data"]
): React.ReactElement {
  return (
    <div className="space-y-5">
      <InviteLinkCard code={profile.code} inviteUrl={profile.inviteUrl} />

      {dashboard ? (
        <>
          <AffiliateStats
            totalReferrals={dashboard.stats.totalReferrals}
            grantedRewardDays={dashboard.stats.grantedRewardDays}
          />
          <ReferralList referrals={dashboard.referrals} />
        </>
      ) : null}
    </div>
  );
}

function renderProfileState(
  profile: ReturnType<typeof useAffiliateProfile>["data"],
  onRetry: () => void
): React.ReactElement {
  if (profile?.eligibility.canParticipate === false) {
    return <NotEligibleState reason={profile.eligibility.reason} />;
  }

  return <ErrorState onRetry={onRetry} />;
}

export function AffiliateDashboardContainer(): React.ReactElement {
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useAffiliateProfile();
  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError: dashboardError,
    refetch: refetchDashboard,
  } = useAffiliateDashboard();

  if (shouldShowLoading(profileLoading, dashboardLoading)) return <LoadingSkeleton />;

  if (shouldShowError(profileError, dashboardError)) {
    return (
      <ErrorState
        onRetry={() => {
          void refetchProfile();
          void refetchDashboard();
        }}
      />
    );
  }

  if (!profile || !profile.code) return renderProfileState(profile, () => void refetchProfile());

  return renderDashboardContent(profile, dashboard);
}
