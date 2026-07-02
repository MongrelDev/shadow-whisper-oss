import { Users } from "lucide-react";
import { m } from "~/paraglide/messages";
import { cn } from "@/lib/utils";
import type { AffiliateReferralItem, ReferralStatus } from "../../../../shared/ipc-types";

function getStatusLabel(status: ReferralStatus): string {
  if (status === "pending") return m.affiliate_status_pending();
  if (status === "qualified") return m.affiliate_status_qualified();
  if (status === "rewarded") return m.affiliate_status_rewarded();
  return m.affiliate_status_rejected();
}

const STATUS_COLORS: Record<ReferralStatus, string> = {
  pending: "text-muted-foreground",
  qualified: "text-violet-500",
  rewarded: "text-foreground",
  rejected: "text-destructive",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
}

interface ReferralListProps {
  referrals: readonly AffiliateReferralItem[];
}

export function ReferralList({ referrals }: ReferralListProps): React.ReactElement {
  if (referrals.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <Users className="mx-auto size-5 text-muted-foreground/50 mb-2" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">{m.affiliate_referral_empty()}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
      {referrals.map((r) => (
        <div key={r.referredEmail} className="flex items-center gap-3 px-4 py-3 bg-card">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {r.referredName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground truncate">{r.referredEmail}</p>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs", STATUS_COLORS[r.status])}>
                {getStatusLabel(r.status)}
              </span>
              <span className="text-xs text-muted-foreground/50">·</span>
              <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
            </div>
          </div>

          {r.rewardGranted && (
            <span className="shrink-0 rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-500">
              {m.affiliate_referral_reward_label()}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
