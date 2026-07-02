import { useState } from "react";
import { Check, Crown, Sparkles, Key } from "lucide-react";
import { cva } from "class-variance-authority";
import { m } from "~/paraglide/messages";
import { getLocale } from "~/paraglide/runtime";
import { cn } from "@/lib/utils";
import { AsyncButton } from "./ui/async-button";
import { Button } from "./ui/button";
import { usePlans } from "../hooks/use-plans";
import { useCheckout } from "../hooks/use-checkout";
import { useCheckoutStatusPolling } from "../hooks/use-checkout-status-polling";
import { useSubscriptionStatus } from "../hooks/use-user";
import type { PlanFeatureKey, PlanInfo, PlanPrice } from "../../shared/ipc-types";

interface PricingCardsProps {
  onTrial?: (annual: boolean) => void;
  onSubscribe?: (annual: boolean) => void;
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Sparkles,
  pro: Crown,
  byok: Key,
};

const PLAN_NAME_BY_ID = {
  free: () => m.pricing_plan_free_name(),
  pro: () => m.pricing_plan_pro_name(),
  byok: () => m.pricing_plan_byok_name(),
} satisfies Record<PlanInfo["name"], () => string>;

const PLAN_TAG_BY_ID = {
  free: () => m.pricing_plan_free_tag(),
  pro: () => m.pricing_plan_pro_tag(),
  byok: () => m.pricing_plan_byok_tag(),
} satisfies Record<PlanInfo["name"], () => string>;

const FEATURE_LABEL_BY_KEY = {
  weekly_words_2000: () => m.pricing_plan_feature_weekly_words_2000(),
  global_shortcut: () => m.pricing_plan_feature_global_shortcut(),
  ai_cleanup: () => m.pricing_plan_feature_ai_cleanup(),
  history_7_days: () => m.pricing_plan_feature_history_7_days(),
  unlimited_dictation: () => m.pricing_plan_feature_unlimited_dictation(),
  full_ai_rewrite: () => m.pricing_plan_feature_full_ai_rewrite(),
  personal_dictionary: () => m.pricing_plan_feature_personal_dictionary(),
  cloud_history: () => m.pricing_plan_feature_cloud_history(),
  bring_your_own_key: () => m.pricing_plan_feature_bring_your_own_key(),
  multi_provider_support: () => m.pricing_plan_feature_multi_provider_support(),
  unlimited_words: () => m.pricing_plan_feature_unlimited_words(),
  ai_cost_on_your_account: () => m.pricing_plan_feature_ai_cost_on_your_account(),
} satisfies Record<PlanFeatureKey, () => string>;

function formatPlanPrice(price: PlanPrice): string {
  return new Intl.NumberFormat(getLocale(), {
    style: "currency",
    currency: price.currency,
    minimumFractionDigits: price.amountInCents === 0 ? 0 : 2,
    maximumFractionDigits: price.amountInCents === 0 ? 0 : 2,
  }).format(price.amountInCents / 100);
}

function getPlanDisplayName(plan: PlanInfo): string {
  return PLAN_NAME_BY_ID[plan.name]();
}

function getPlanDescription(plan: PlanInfo): string {
  return PLAN_TAG_BY_ID[plan.name]();
}

function getPlanFeatureLabel(featureKey: PlanFeatureKey): string {
  return FEATURE_LABEL_BY_KEY[featureKey]();
}

function RecommendedBadge(): React.ReactElement {
  return (
    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground tracking-wide uppercase">
        {m.pricing_badge_recommended()}
      </span>
    </div>
  );
}

function StatusBadge({ label }: { label: string }): React.ReactElement {
  return (
    <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {label}
    </span>
  );
}

function CheckoutButton({
  isLoading,
  disabled,
  onClick,
  label,
}: {
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
}): React.ReactElement {
  return (
    <AsyncButton
      size="sm"
      className="w-full"
      onClick={onClick}
      isPending={isLoading}
      pendingLabel={m.pricing_checkout_opening()}
      disabled={disabled}
    >
      {label}
    </AsyncButton>
  );
}

function PeriodToggle({
  annual,
  onToggle,
  annualSavingsInMonths,
}: {
  annual: boolean;
  onToggle: (annual: boolean) => void;
  annualSavingsInMonths?: number;
}): React.ReactElement {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-muted/50 p-0.5">
      <button
        type="button"
        aria-pressed={!annual}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
          !annual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
        )}
        onClick={() => onToggle(false)}
      >
        {m.pricing_period_monthly()}
      </button>
      <button
        type="button"
        aria-pressed={annual}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
          annual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
        )}
        onClick={() => onToggle(true)}
      >
        {m.pricing_period_annual()}
        {annualSavingsInMonths && (
          <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            {m.pricing_period_annual_badge({ months: annualSavingsInMonths })}
          </span>
        )}
      </button>
    </div>
  );
}

function FreeCardFooter({ isCurrentPlan }: { isCurrentPlan: boolean }): React.ReactElement | null {
  if (!isCurrentPlan) return null;

  return (
    <Button variant="outline" size="sm" className="w-full" disabled>
      {m.pricing_current_plan()}
    </Button>
  );
}

function ProCardFooter({
  plan,
  annual,
  isCurrentPro,
  isCheckingOut,
  disableActions,
  onSubscribe,
  onTrial,
}: {
  plan: PlanInfo;
  annual: boolean;
  isCurrentPro: boolean;
  isCheckingOut: boolean;
  disableActions: boolean;
  onSubscribe?: (annual: boolean) => void;
  onTrial?: (annual: boolean) => void;
}): React.ReactElement {
  if (isCurrentPro) {
    return (
      <Button variant="outline" size="sm" className="w-full" disabled>
        {m.pricing_current_plan()}
      </Button>
    );
  }

  const handler = onSubscribe ?? onTrial;

  return (
    <>
      {plan.trialDays && (
        <p className="text-xs text-center text-muted-foreground/60">
          {m.pricing_trial_notice({ days: plan.trialDays })}
        </p>
      )}
      {handler && (
        <CheckoutButton
          isLoading={isCheckingOut}
          disabled={disableActions}
          onClick={() => handler(annual)}
          label={m.pricing_subscribe_now()}
        />
      )}
    </>
  );
}

function DisabledCardFooter({ label }: { label?: string }): React.ReactElement {
  return (
    <Button variant="outline" size="sm" className="w-full" disabled>
      {label ?? m.pricing_unavailable()}
    </Button>
  );
}

type CardVariant = "default" | "hero" | "disabled";

const planCardVariants = cva(
  "relative flex flex-col rounded-xl border p-5 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-border bg-card hover:border-border/80",
        hero: "border-primary bg-primary/[0.03] shadow-[0_0_0_1px_var(--color-primary),0_4px_24px_-4px_color-mix(in_oklch,var(--color-primary)_15%,transparent)]",
        disabled: "border-border bg-card opacity-50 pointer-events-none",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const iconWrapperVariants = cva("flex h-7 w-7 items-center justify-center rounded-lg", {
  variants: {
    variant: {
      default: "bg-muted",
      hero: "bg-primary/10",
      disabled: "bg-muted",
    },
  },
  defaultVariants: { variant: "default" },
});

const accentVariants = cva("", {
  variants: {
    variant: {
      default: "text-muted-foreground",
      hero: "text-primary",
      disabled: "text-muted-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

const priceVariants = cva("font-bold tracking-tight", {
  variants: {
    variant: {
      default: "text-2xl",
      hero: "text-3xl",
      disabled: "text-2xl",
    },
  },
  defaultVariants: { variant: "default" },
});

function PlanCardHeader({
  plan,
  variant,
  isCurrentPlan,
}: {
  plan: PlanInfo;
  variant: CardVariant;
  isCurrentPlan: boolean;
}) {
  const Icon = PLAN_ICONS[plan.name] ?? Sparkles;

  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={iconWrapperVariants({ variant })}>
        <Icon className={cn("h-3.5 w-3.5", accentVariants({ variant }))} strokeWidth={2} />
      </div>
      <span className="text-sm font-semibold text-foreground">{getPlanDisplayName(plan)}</span>
      {isCurrentPlan && <StatusBadge label={m.pricing_badge_current()} />}
      {variant === "disabled" && <StatusBadge label={m.pricing_plan_coming_soon()} />}
    </div>
  );
}

function PlanCardPricing({
  plan,
  variant,
  annual,
}: {
  plan: PlanInfo;
  variant: CardVariant;
  annual: boolean;
}) {
  const price = annual ? plan.annual : plan.monthly;

  return (
    <div className="mb-4">
      <div className="flex items-baseline gap-1">
        <span className={priceVariants({ variant })}>{formatPlanPrice(price)}</span>
        {plan.name !== "free" && (
          <span className="text-xs text-muted-foreground font-medium">
            {annual ? m.pricing_per_year() : m.pricing_per_month()}
          </span>
        )}
      </div>
      {annual && plan.annualSavingsInMonths && (
        <span className="text-xs font-medium text-primary mt-0.5 block">
          {m.pricing_period_annual_badge({ months: plan.annualSavingsInMonths })}
        </span>
      )}
      <p className="text-xs text-muted-foreground mt-1.5">{getPlanDescription(plan)}</p>
    </div>
  );
}

function PlanCardFeatures({
  featureKeys,
  variant,
}: {
  featureKeys: PlanFeatureKey[];
  variant: CardVariant;
}) {
  return (
    <ul className="space-y-2 mb-5 flex-1">
      {featureKeys.map((featureKey) => (
        <li key={featureKey} className="flex items-start gap-2">
          <Check
            className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", accentVariants({ variant }))}
            strokeWidth={2.5}
          />
          <span className="text-[13px] leading-snug text-foreground/80">
            {getPlanFeatureLabel(featureKey)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PlanCard({
  plan,
  annual,
  isCurrentPlan,
  isRefreshingStatus,
  isCheckingOut,
  onTrial,
  onSubscribe,
}: {
  plan: PlanInfo;
  annual: boolean;
  isCurrentPlan: boolean;
  isRefreshingStatus: boolean;
  isCheckingOut: boolean;
  onTrial?: (annual: boolean) => void;
  onSubscribe?: (annual: boolean) => void;
}) {
  const isDisabled = plan.availability === "coming_soon";
  const variant: CardVariant = isDisabled ? "disabled" : plan.recommended ? "hero" : "default";
  const isCurrentPro = isCurrentPlan && plan.name === "pro";
  const disableActions = isCheckingOut || isRefreshingStatus;

  return (
    <div className={planCardVariants({ variant })}>
      {variant === "hero" && <RecommendedBadge />}

      <PlanCardHeader plan={plan} variant={variant} isCurrentPlan={isCurrentPlan} />
      <PlanCardPricing plan={plan} variant={variant} annual={annual} />
      <PlanCardFeatures featureKeys={plan.featureKeys} variant={variant} />

      <div className="space-y-2 mt-auto">
        <PlanCardFooter
          plan={plan}
          annual={annual}
          isDisabled={isDisabled}
          isCurrentPlan={isCurrentPlan}
          isCurrentPro={isCurrentPro}
          isCheckingOut={isCheckingOut}
          disableActions={disableActions}
          onSubscribe={onSubscribe}
          onTrial={onTrial}
        />
      </div>
    </div>
  );
}

function PlanCardFooter({
  plan,
  annual,
  isDisabled,
  isCurrentPlan,
  isCurrentPro,
  isCheckingOut,
  disableActions,
  onSubscribe,
  onTrial,
}: {
  plan: PlanInfo;
  annual: boolean;
  isDisabled: boolean;
  isCurrentPlan: boolean;
  isCurrentPro: boolean;
  isCheckingOut: boolean;
  disableActions: boolean;
  onSubscribe?: (annual: boolean) => void;
  onTrial?: (annual: boolean) => void;
}): React.ReactElement | null {
  if (isDisabled) return <DisabledCardFooter label={m.pricing_plan_coming_soon()} />;
  if (plan.name === "free") return <FreeCardFooter isCurrentPlan={isCurrentPlan} />;
  if (plan.name === "byok") return <DisabledCardFooter label={m.pricing_plan_coming_soon()} />;
  if (plan.name === "pro") {
    return (
      <ProCardFooter
        plan={plan}
        annual={annual}
        isCurrentPro={isCurrentPro}
        isCheckingOut={isCheckingOut}
        disableActions={disableActions}
        onSubscribe={onSubscribe}
        onTrial={onTrial}
      />
    );
  }
  return null;
}

function PricingLoading(): React.ReactElement {
  return (
    <div aria-busy="true" className="space-y-5">
      <span className="block h-9 w-52 animate-pulse rounded-full bg-muted" />
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <span className="block h-5 w-24 animate-pulse rounded bg-muted" />
            <span className="mt-4 block h-8 w-28 animate-pulse rounded bg-muted" />
            <div className="mt-5 space-y-2.5">
              {Array.from({ length: 4 }).map((_, j) => (
                <span key={j} className="block h-3.5 w-[85%] animate-pulse rounded bg-muted/70" />
              ))}
            </div>
            <span className="mt-6 block h-8 w-full animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingCardsLoaded({
  plans,
  subscription,
  isPending,
  handleTrial,
  handleSubscribe,
}: {
  plans: PlanInfo[];
  subscription: { plan?: string } | undefined;
  isPending: boolean;
  handleTrial: (annual: boolean) => void;
  handleSubscribe: (annual: boolean) => void;
}): React.ReactElement {
  const [annual, setAnnual] = useState(false);
  const currentPlan = subscription?.plan ?? "free";
  const recommendedPlan = plans.find((p) => p.recommended);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <PeriodToggle
          annual={annual}
          onToggle={setAnnual}
          annualSavingsInMonths={recommendedPlan?.annualSavingsInMonths}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.name}
            plan={plan}
            annual={annual}
            isCurrentPlan={plan.name === currentPlan}
            isRefreshingStatus={false}
            isCheckingOut={isPending}
            onTrial={handleTrial}
            onSubscribe={handleSubscribe}
          />
        ))}
      </div>
    </div>
  );
}

export function PricingCards({ onTrial, onSubscribe }: PricingCardsProps): React.ReactElement {
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: subscription } = useSubscriptionStatus();
  const { checkout, isPending, isPolling, stopPolling } = useCheckout("billing");

  useCheckoutStatusPolling({
    enabled: isPolling,
    origin: "billing",
    onUpgraded: stopPolling,
  });

  const defaultCheckout = (a: boolean): void => checkout({ annual: a });
  const handleTrial = onTrial ?? defaultCheckout;
  const handleSubscribe = onSubscribe ?? defaultCheckout;

  if (plansLoading || !plans) return <PricingLoading />;

  return (
    <PricingCardsLoaded
      plans={plans}
      subscription={subscription}
      isPending={isPending}
      handleTrial={handleTrial}
      handleSubscribe={handleSubscribe}
    />
  );
}
