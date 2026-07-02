/** Subscription plan types */
export type Plan = "free" | "pro" | "byok";
export type BillingCurrency = "BRL" | "USD";
export type PlanAvailability = "active" | "coming_soon";
export type PlanFeatureKey =
  | "weekly_words_2000"
  | "global_shortcut"
  | "ai_cleanup"
  | "history_7_days"
  | "unlimited_dictation"
  | "full_ai_rewrite"
  | "personal_dictionary"
  | "cloud_history"
  | "bring_your_own_key"
  | "multi_provider_support"
  | "unlimited_words"
  | "ai_cost_on_your_account";

export type DisplayStatus = "free" | "active" | "canceling" | "canceled";

export interface PlanPrice {
  amountInCents: number;
  currency: BillingCurrency;
}

export interface SubscriptionStatusResponse {
  plan: Plan;
  status: string;
  displayStatus: DisplayStatus;
  trialEnd: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: number | null;
  usage: {
    spokenWords: number;
    transformedWords: number;
    totalWords: number;
    limit: number;
  };
}

/** Word limits by plan (words/week) */
export const PLAN_WORD_LIMITS: Record<Plan, number> = {
  free: 2000,
  pro: Infinity,
  byok: Infinity,
};

export interface PlanInfo {
  name: Plan;
  availability: PlanAvailability;
  monthly: PlanPrice;
  annual: PlanPrice;
  featureKeys: PlanFeatureKey[];
  recommended?: boolean;
  annualSavingsInMonths?: number;
  trialDays?: number;
  wordLimit?: number;
}
