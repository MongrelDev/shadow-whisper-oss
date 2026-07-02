"use client";

import { useState } from "react";
import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";
import type { PlanFeatureKey, PlanInfo, PlanPrice } from "@whisper/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Plan = {
  name: string;
  badge?: string;
  priceCurrency: string;
  priceValue: string;
  priceUnit: string;
  tag: string;
  features: string[];
  cta: { label: string; variant: "default" | "outline"; href: string };
  featured?: boolean;
  disabled?: boolean;
  disabledLabel?: string;
};

interface PricingDisplayProps {
  locale: Locale;
  plans: PlanInfo[];
  launched: boolean;
}

const PLAN_NAME_BY_ID = {
  free: (locale: Locale) => m.home_pricing_plan_free_name({}, { locale }),
  pro: (locale: Locale) => m.home_pricing_plan_standard_name({}, { locale }),
  byok: (locale: Locale) => m.home_pricing_plan_byok_name({}, { locale }),
} satisfies Record<PlanInfo["name"], (locale: Locale) => string>;

const PLAN_TAG_BY_ID = {
  free: (locale: Locale) => m.home_pricing_plan_free_tag({}, { locale }),
  pro: (locale: Locale) => m.home_pricing_plan_standard_tag({}, { locale }),
  byok: (locale: Locale) => m.home_pricing_plan_byok_tag({}, { locale }),
} satisfies Record<PlanInfo["name"], (locale: Locale) => string>;

const FEATURE_LABEL_BY_KEY = {
  weekly_words_2000: (locale: Locale) => m.home_pricing_plan_free_feature_1({}, { locale }),
  global_shortcut: (locale: Locale) => m.home_pricing_plan_free_feature_2({}, { locale }),
  ai_cleanup: (locale: Locale) => m.home_pricing_plan_free_feature_3({}, { locale }),
  history_7_days: (locale: Locale) => m.home_pricing_plan_free_feature_4({}, { locale }),
  unlimited_dictation: (locale: Locale) => m.home_pricing_plan_standard_feature_1({}, { locale }),
  full_ai_rewrite: (locale: Locale) => m.home_pricing_plan_standard_feature_2({}, { locale }),
  personal_dictionary: (locale: Locale) => m.home_pricing_plan_standard_feature_3({}, { locale }),
  cloud_history: (locale: Locale) => m.home_pricing_plan_standard_feature_4({}, { locale }),
  bring_your_own_key: (locale: Locale) => m.home_pricing_plan_byok_feature_1({}, { locale }),
  multi_provider_support: (locale: Locale) => m.home_pricing_plan_byok_feature_2({}, { locale }),
  unlimited_words: (locale: Locale) => m.home_pricing_plan_byok_feature_3({}, { locale }),
  ai_cost_on_your_account: (locale: Locale) => m.home_pricing_plan_byok_feature_4({}, { locale }),
} satisfies Record<PlanFeatureKey, (locale: Locale) => string>;

function getPlanName(plan: PlanInfo, locale: Locale): string {
  return PLAN_NAME_BY_ID[plan.name](locale);
}

function getPlanTag(plan: PlanInfo, locale: Locale): string {
  return PLAN_TAG_BY_ID[plan.name](locale);
}

function getFeatureLabel(featureKey: PlanFeatureKey, locale: Locale): string {
  return FEATURE_LABEL_BY_KEY[featureKey](locale);
}

function formatPrice(price: PlanPrice, locale: Locale): { currency: string; value: string } {
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: price.currency,
    minimumFractionDigits: price.amountInCents === 0 ? 0 : 2,
    maximumFractionDigits: price.amountInCents === 0 ? 0 : 2,
  }).formatToParts(price.amountInCents / 100);

  const currency = parts
    .filter((part) => part.type === "currency")
    .map((part) => part.value)
    .join("")
    .trim();
  const value = parts
    .filter((part) => part.type !== "currency" && part.type !== "literal")
    .map((part) => part.value)
    .join("");

  return { currency, value };
}

function getCtaLabel(
  plan: PlanInfo,
  locale: Locale,
  launched: boolean,
  waitlistCta: string
): string {
  if (plan.availability === "coming_soon") {
    return m.home_pricing_plan_byok_cta({}, { locale });
  }
  if (!launched) return waitlistCta;
  if (plan.name === "free") return m.home_pricing_plan_free_cta({}, { locale });
  return m.home_pricing_plan_standard_cta({}, { locale });
}

function getPriceUnit(locale: Locale, annual: boolean): string {
  return annual
    ? m.home_pricing_unit_year({}, { locale })
    : m.home_pricing_unit_month({}, { locale });
}

function getDisabledLabel(plan: PlanInfo, locale: Locale): string | undefined {
  if (plan.availability !== "coming_soon") return undefined;
  return m.home_pricing_plan_byok_disabled({}, { locale });
}

function toDisplayPlan(
  plan: PlanInfo,
  locale: Locale,
  annual: boolean,
  launched: boolean,
  waitlistCta: string,
  ctaHref: string,
  standardFeature5: string
): Plan {
  const price = annual ? plan.annual : plan.monthly;
  const formattedPrice = formatPrice(price, locale);
  const features = plan.featureKeys.map((featureKey) => getFeatureLabel(featureKey, locale));

  if (plan.name === "pro") features.push(standardFeature5);

  return {
    name: getPlanName(plan, locale),
    badge: plan.recommended ? m.home_pricing_plan_standard_badge({}, { locale }) : undefined,
    priceCurrency: formattedPrice.currency,
    priceValue: formattedPrice.value,
    priceUnit: getPriceUnit(locale, annual),
    tag: getPlanTag(plan, locale),
    features,
    cta: {
      label: getCtaLabel(plan, locale, launched, waitlistCta),
      variant: plan.recommended ? "default" : "outline",
      href: ctaHref,
    },
    featured: plan.recommended,
    disabled: plan.availability === "coming_soon",
    disabledLabel: getDisabledLabel(plan, locale),
  };
}

export function PricingDisplay({
  locale,
  plans,
  launched,
}: PricingDisplayProps): React.ReactElement {
  const [annual, setAnnual] = useState(false);
  const waitlistCta = m.home_pricing_waitlist_cta({}, { locale });
  const ctaHref = launched ? "#download" : "#waitlist";
  const standardFeature5 = launched
    ? m.home_pricing_plan_standard_feature_5({}, { locale })
    : m.home_pricing_waitlist_standard_feature_5({}, { locale });
  const displayPlans = plans.map((plan) =>
    toDisplayPlan(plan, locale, annual, launched, waitlistCta, ctaHref, standardFeature5)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        <PeriodToggle annual={annual} onToggle={setAnnual} locale={locale} />
      </div>
      <PricingGrid plans={displayPlans} />
    </div>
  );
}

function PeriodToggle({
  annual,
  onToggle,
  locale,
}: {
  annual: boolean;
  onToggle: (annual: boolean) => void;
  locale: Locale;
}): React.ReactElement {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-muted/50 p-0.5">
      <button
        className={cn(
          "rounded-full px-5 py-3 text-sm font-medium transition-all duration-200",
          !annual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
        )}
        onClick={() => onToggle(false)}
        aria-pressed={!annual}
        aria-label={m.home_pricing_toggle_monthly({}, { locale })}
      >
        {m.home_pricing_toggle_monthly({}, { locale })}
      </button>
      <button
        className={cn(
          "rounded-full px-5 py-3 text-sm font-medium transition-all duration-200",
          annual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
        )}
        onClick={() => onToggle(true)}
        aria-pressed={annual}
        aria-label={m.home_pricing_toggle_annual({}, { locale })}
      >
        {m.home_pricing_toggle_annual({}, { locale })}
        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          {m.home_pricing_toggle_annual_badge({}, { locale })}
        </span>
      </button>
    </div>
  );
}

function PricingGrid({ plans }: { plans: Plan[] }): React.ReactElement {
  return (
    <div className="grid items-stretch gap-4 md:grid-cols-3">
      {plans.map((plan) => (
        <PricingCard key={plan.name} plan={plan} />
      ))}
    </div>
  );
}

function PricingCardBadge({ badge }: { badge?: string }): React.ReactElement | null {
  if (!badge) return null;
  return (
    <span className="absolute -top-2.5 left-6 rounded-full border border-[color-mix(in_oklch,var(--color-primary)_35%,var(--color-border))] bg-background px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
      {badge}
    </span>
  );
}

function PricingCardDisabledBadge({
  disabledLabel,
}: {
  disabledLabel?: string;
}): React.ReactElement | null {
  if (!disabledLabel) return null;
  return (
    <span className="absolute -top-2.5 right-6 rounded-full border border-border bg-background px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
      {disabledLabel}
    </span>
  );
}

function getPricingCardTone(plan: Plan): string {
  return plan.featured
    ? "border-[color-mix(in_oklch,var(--color-primary)_35%,var(--color-border))] bg-[color-mix(in_oklch,var(--color-primary)_3.5%,var(--color-background))]"
    : "border-border bg-background";
}

function getPricingLabelTone(plan: Plan): string {
  return plan.featured ? "text-primary" : "text-muted-foreground";
}

function getPricingCardHref(plan: Plan): string | undefined {
  return plan.disabled ? undefined : plan.cta.href;
}

function getPricingCardTabIndex(plan: Plan): number | undefined {
  return plan.disabled ? -1 : undefined;
}

function PricingCard({ plan }: { plan: Plan }): React.ReactElement {
  const cardTone = getPricingCardTone(plan);
  const labelTone = getPricingLabelTone(plan);

  return (
    <article
      className={cn(
        "@container relative flex h-full flex-col rounded-2xl border p-6",
        plan.disabled && "opacity-50",
        cardTone
      )}
    >
      <PricingCardBadge badge={plan.badge} />
      <PricingCardDisabledBadge disabledLabel={plan.disabledLabel} />

      <h3 className={cn("font-mono text-[11px] uppercase tracking-[0.22em]", labelTone)}>
        {plan.name}
      </h3>

      <div className="mt-4 flex flex-col items-start gap-1.5 @[15rem]:flex-row @[15rem]:items-baseline">
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-medium tracking-[-0.01em] text-muted-foreground">
            {plan.priceCurrency}
          </span>
          <span className="text-[40px] font-semibold leading-none tracking-[-0.03em]">
            {plan.priceValue}
          </span>
        </div>
        <span className="whitespace-nowrap text-[13px] text-muted-foreground">
          {plan.priceUnit}
        </span>
      </div>

      <p className="mt-2.5 min-w-0 text-[13px] leading-[1.7] text-muted-foreground text-balance">
        {plan.tag}
      </p>

      <ul className="mt-5 grid flex-1 content-start gap-2.5 border-t border-border/60 pt-5">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="grid grid-cols-[auto_1fr] items-start gap-2.5 text-[13.5px] leading-[1.55]"
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-[9px] h-px w-3",
                plan.featured
                  ? "bg-[color-mix(in_oklch,var(--color-primary)_65%,transparent)]"
                  : "bg-foreground/30"
              )}
            />
            <span className="min-w-0 text-pretty">{feature}</span>
          </li>
        ))}
      </ul>

      <a
        href={getPricingCardHref(plan)}
        className={cn(
          buttonVariants({ variant: plan.cta.variant }),
          "mt-5 min-h-11 w-full self-end whitespace-normal px-4 py-3 text-center leading-tight",
          plan.disabled && "pointer-events-none opacity-50"
        )}
        aria-disabled={plan.disabled}
        tabIndex={getPricingCardTabIndex(plan)}
      >
        {plan.cta.label}
      </a>
    </article>
  );
}
