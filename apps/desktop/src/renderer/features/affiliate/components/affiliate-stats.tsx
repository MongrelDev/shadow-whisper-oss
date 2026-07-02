import { m } from "~/paraglide/messages";

interface AffiliateStatsProps {
  totalReferrals: number;
  grantedRewardDays: number;
}

export function AffiliateStats({
  totalReferrals,
  grantedRewardDays,
}: AffiliateStatsProps): React.ReactElement {
  if (grantedRewardDays === 0 && totalReferrals === 0) return <></>;

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
      <div className="bg-card p-4">
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {grantedRewardDays}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{m.affiliate_stat_days_earned()}</p>
      </div>
      <div className="bg-card p-4">
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {totalReferrals}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {totalReferrals === 1
            ? m.affiliate_stat_referrals_singular()
            : m.affiliate_stat_referrals_plural()}
        </p>
      </div>
    </div>
  );
}
