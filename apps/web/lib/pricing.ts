import { headers } from "next/headers";
import type { BillingCurrency, PlanInfo } from "@whisper/api";
import { createApiClient } from "@whisper/api/client";
import { workerApiUrl } from "./sign-up";

const DEFAULT_TRIAL_DAYS = 15;

export const PLAN_PRICES = {
  BRL: {
    free: { monthly: 0, annual: 0 },
    pro: { monthly: 1999, annual: 19900 },
    byok: { monthly: 499, annual: 4990 },
  },
  USD: {
    free: { monthly: 0, annual: 0 },
    pro: { monthly: 749, annual: 7490 },
    byok: { monthly: 199, annual: 1999 },
  },
} as const satisfies Record<
  BillingCurrency,
  Record<PlanInfo["name"], { monthly: number; annual: number }>
>;

function resolveStaticPricingPlans(country: string | undefined): PlanInfo[] {
  const currency: BillingCurrency = country === "BR" ? "BRL" : "USD";
  const prices = PLAN_PRICES[currency];

  return [
    {
      name: "free",
      availability: "active",
      monthly: { amountInCents: prices.free.monthly, currency },
      annual: { amountInCents: prices.free.annual, currency },
      featureKeys: ["weekly_words_2000", "global_shortcut", "ai_cleanup", "history_7_days"],
      wordLimit: 2000,
    },
    {
      name: "pro",
      availability: "active",
      monthly: { amountInCents: prices.pro.monthly, currency },
      annual: { amountInCents: prices.pro.annual, currency },
      featureKeys: [
        "unlimited_dictation",
        "full_ai_rewrite",
        "personal_dictionary",
        "cloud_history",
      ],
      recommended: true,
      annualSavingsInMonths: 2,
      trialDays: DEFAULT_TRIAL_DAYS,
    },
    {
      name: "byok",
      availability: "coming_soon",
      monthly: { amountInCents: prices.byok.monthly, currency },
      annual: { amountInCents: prices.byok.annual, currency },
      featureKeys: [
        "bring_your_own_key",
        "multi_provider_support",
        "unlimited_words",
        "ai_cost_on_your_account",
      ],
      annualSavingsInMonths: 2,
    },
  ];
}

export async function resolvePricingPlans(): Promise<PlanInfo[]> {
  const requestHeaders = await headers();
  const country = requestHeaders.get("cf-ipcountry")?.toUpperCase();

  try {
    const api = createApiClient(workerApiUrl(), {});
    const response = await api.billing.plans.$get(undefined, {
      headers: country ? { "cf-ipcountry": country } : undefined,
      init: { cache: "no-store" },
    });

    if (response.ok) {
      return response.json();
    }
  } catch {
    // Pricing is static enough for the marketing page. Keep SSR resilient when the Worker is down locally.
  }

  return resolveStaticPricingPlans(country);
}
