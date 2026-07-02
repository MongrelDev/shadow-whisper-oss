import { Loader2 } from "lucide-react";
import { cva } from "class-variance-authority";
import { Button } from "~/components/ui/button";
import { PlanBadge } from "~/features/billing/components/plan-badge";
import { UpgradeCard } from "~/features/billing/components/upgrade-card";
import { useSubscriptionStatus } from "~/features/billing/hooks/use-subscription-status";
import { useBillingPortal } from "~/features/settings/hooks/use-billing-portal";
import { m } from "~/paraglide/messages";
import type { SubscriptionStatus } from "@whisper/api";

const usageBarVariants = cva("h-1.5 rounded-full transition-all", {
  variants: {
    fill: {
      green: "bg-primary/60",
      amber: "bg-[oklch(0.75_0.15_85)]",
      red: "bg-destructive",
    },
  },
  defaultVariants: {
    fill: "green",
  },
});

type UsageBarFill = "green" | "amber" | "red";

function resolveUsageFill(ratio: number): UsageBarFill {
  if (ratio > 0.8) return "red";
  if (ratio > 0.5) return "amber";
  return "green";
}

function UsageBar({ status }: { status: SubscriptionStatus }) {
  const { totalWords, limit } = status.usage;
  const ratio = limit > 0 ? Math.min(totalWords / limit, 1) : 0;
  const fill = resolveUsageFill(ratio);

  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={usageBarVariants({ fill })}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {m.billing_usage_label({
          used: String(totalWords),
          limit: String(limit),
        })}
      </p>
    </div>
  );
}

function PlanStatusRow({ status }: { status: SubscriptionStatus }) {
  const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

  function statusText(): string {
    if (status.displayStatus === "canceling" && status.cancelAtPeriodEnd) {
      const date = status.currentPeriodEnd
        ? dateFormatter.format(new Date(status.currentPeriodEnd * 1000))
        : "";
      return m.billing_status_cancels({ date });
    }
    if (status.trialEnd !== null && status.displayStatus === "active") {
      const date = dateFormatter.format(new Date(status.trialEnd * 1000));
      return m.billing_status_trial_ends({ date });
    }
    return m.billing_status_active();
  }

  return (
    <div className="flex items-center gap-2">
      <PlanBadge />
      <p className="text-xs text-muted-foreground">{statusText()}</p>
    </div>
  );
}

function FreeUserActions() {
  return <UpgradeCard origin="settings" />;
}

function ProUserActions() {
  const { openPortal, isPending } = useBillingPortal();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={openPortal}
      disabled={isPending}
      className="w-full"
    >
      {isPending ? m.settings_billing_open_portal_pending() : m.settings_billing_open_portal()}
    </Button>
  );
}

function BillingSectionContent({ status }: { status: SubscriptionStatus }) {
  const isFree = status.displayStatus === "free";

  return (
    <div className="space-y-4">
      <PlanStatusRow status={status} />
      {isFree ? (
        <UsageBar status={status} />
      ) : (
        <p className="text-xs text-muted-foreground">{m.billing_usage_unlimited()}</p>
      )}
      {isFree ? <FreeUserActions /> : <ProUserActions />}
    </div>
  );
}

function BillingSectionLoading() {
  return (
    <div className="flex items-center justify-center py-4">
      <Loader2 className="size-4 animate-spin text-muted-foreground" />
    </div>
  );
}

export function BillingSection() {
  const { data: status, isPending } = useSubscriptionStatus();

  return (
    <section id="billing" className="rounded-xl border border-border bg-background p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {m.settings_billing_section()}
      </h2>
      {isPending || !status ? <BillingSectionLoading /> : <BillingSectionContent status={status} />}
    </section>
  );
}
