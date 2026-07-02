import type { DisplayStatus, Plan } from "../schemas";

export interface CurrentSubscription {
  readonly plan: Plan;
  readonly status: "active" | "trialing";
  readonly trialEnd: number | null;
  readonly currentPeriodEnd: number | null;
}

export interface LatestSubscription {
  readonly plan: Plan;
  readonly status: string;
  readonly trialEnd: number | null;
  readonly currentPeriodEnd: number | null;
  readonly cancelAtPeriodEnd: boolean;
  readonly canceledAt: number | null;
}

export interface SubscriptionStatus {
  readonly plan: Plan;
  readonly status: string;
  readonly displayStatus: DisplayStatus;
  readonly trialEnd: number | null;
  readonly currentPeriodEnd: number | null;
  readonly cancelAtPeriodEnd: boolean;
  readonly canceledAt: number | null;
  readonly usage: {
    readonly spokenWords: number;
    readonly transformedWords: number;
    readonly totalWords: number;
    readonly limit: number;
  };
}
