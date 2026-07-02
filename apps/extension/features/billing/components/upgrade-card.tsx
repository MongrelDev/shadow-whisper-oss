import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { PlanInfo } from "@whisper/api";
import { Button } from "~/components/ui/button";
import { useCheckout } from "~/features/billing/hooks/use-checkout";
import type { CheckoutOrigin } from "~/features/billing/hooks/use-checkout";
import { useCheckoutStatusPolling } from "~/features/billing/hooks/use-checkout-status-polling";
import { usePlans } from "~/features/billing/hooks/use-plans";
import { m } from "~/paraglide/messages";

type BillingCycle = "annual" | "monthly";

type ToggleProps = {
  cycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  showSavingsBadge: boolean;
};

function CycleToggle({ cycle, onChange, showSavingsBadge }: ToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
      <button
        type="button"
        onClick={() => onChange("annual")}
        className={`relative rounded-md py-1 text-xs font-medium transition-colors ${
          cycle === "annual"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {m.billing_annual_label()}
        {showSavingsBadge && (
          <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            {m.billing_annual_save({ percent: "20" })}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={`rounded-md py-1 text-xs font-medium transition-colors ${
          cycle === "monthly"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {m.billing_monthly_label()}
      </button>
    </div>
  );
}

type PriceDisplayProps = {
  cycle: BillingCycle;
  monthlyPriceFormatted: string;
  annualPriceFormatted: string;
};

function PriceDisplay({ cycle, monthlyPriceFormatted, annualPriceFormatted }: PriceDisplayProps) {
  if (cycle === "annual") {
    return (
      <p className="text-sm font-semibold">
        {m.billing_price_per_year({ price: annualPriceFormatted })}
      </p>
    );
  }
  return (
    <p className="text-sm font-semibold">
      {m.billing_price_per_month({ price: monthlyPriceFormatted })}
    </p>
  );
}

function PriceSkeleton() {
  return <div className="h-5 w-20 animate-pulse rounded bg-muted" />;
}

type CtaButtonProps = {
  isPending: boolean;
  isPolling: boolean;
  onCheckout: () => void;
};

function CtaButton({ isPending, isPolling, onCheckout }: CtaButtonProps) {
  const label = (() => {
    if (isPending) return m.billing_upgrade_cta_pending();
    if (isPolling) return m.billing_checkout_polling();
    return m.billing_upgrade_cta();
  })();

  return (
    <Button size="sm" className="w-full" onClick={onCheckout} disabled={isPending || isPolling}>
      {label}
    </Button>
  );
}

function formatPrice(amountInCents: number): string {
  return `$${(amountInCents / 100).toFixed(2)}`;
}

function getProPricing(plans: PlanInfo[] | undefined) {
  const proPlan = plans?.find((p) => p.name === "pro");
  if (!proPlan) {
    return null;
  }
  return {
    monthlyPrice: formatPrice(proPlan.monthly.amountInCents),
    annualPrice: formatPrice(proPlan.annual.amountInCents),
    showSavingsBadge: proPlan.annual.amountInCents < proPlan.monthly.amountInCents * 12,
  };
}

type UpgradeCardProps = {
  origin: CheckoutOrigin;
};

export function UpgradeCard({ origin }: UpgradeCardProps) {
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const { data: plans, isPending: plansLoading } = usePlans();
  const { checkout, isPending, isPolling, stopPolling } = useCheckout(origin);

  const onUpgraded = () => {
    stopPolling();
    toast.success(m.billing_checkout_success());
  };

  useCheckoutStatusPolling({ enabled: isPolling, onUpgraded });

  const pricing = getProPricing(plans);

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="size-4 shrink-0 text-primary" strokeWidth={1.75} />
        <p className="text-sm font-semibold">{m.billing_upgrade_title()}</p>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{m.billing_upgrade_subtitle()}</p>
      <div className="space-y-3">
        <CycleToggle
          cycle={cycle}
          onChange={setCycle}
          showSavingsBadge={!!pricing?.showSavingsBadge}
        />
        {plansLoading ? (
          <PriceSkeleton />
        ) : pricing ? (
          <PriceDisplay
            cycle={cycle}
            monthlyPriceFormatted={pricing.monthlyPrice}
            annualPriceFormatted={pricing.annualPrice}
          />
        ) : null}
        <CtaButton
          isPending={isPending}
          isPolling={isPolling}
          onCheckout={() => checkout({ annual: cycle === "annual" })}
        />
      </div>
    </div>
  );
}
