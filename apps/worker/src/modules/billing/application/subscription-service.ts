import { Context, Effect, Layer } from "effect";
import type { UnknownError } from "effect/Cause";
import { PLAN_WORD_LIMITS, type DisplayStatus, type Plan } from "../schemas";
import { LimitExceededError, type BillingDatabaseError } from "../errors";
import type { LatestSubscription, SubscriptionStatus } from "../domain/subscription";
import { SubscriptionRepository } from "./ports/subscription-repository";
import { UsageReader } from "./ports/usage-reader";

export type PlanInfo = {
  plan: Plan;
  status: "active" | "trialing" | "free";
  trialEnd: number | null;
};

function deriveDisplayStatus(row: LatestSubscription | null): DisplayStatus {
  if (!row) return "free";
  if (row.status === "trialing") return "active";
  if (row.status !== "active") return "canceled";
  return row.cancelAtPeriodEnd ? "canceling" : "active";
}

function buildSubscriptionStatus(
  row: LatestSubscription | null,
  usage: { spokenWords: number; transformedWords: number; totalWords: number }
): SubscriptionStatus {
  if (!row) {
    return {
      plan: "free",
      status: "free",
      displayStatus: "free",
      trialEnd: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      usage: { ...usage, limit: PLAN_WORD_LIMITS["free"] },
    };
  }
  const plan = row.status === "active" || row.status === "trialing" ? row.plan : "free";
  return {
    plan,
    status: row.status,
    displayStatus: deriveDisplayStatus(row),
    trialEnd: row.trialEnd,
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    canceledAt: row.canceledAt,
    usage: { ...usage, limit: PLAN_WORD_LIMITS[plan] },
  };
}

export interface SubscriptionLimitStatus {
  readonly usage: { spokenWords: number; transformedWords: number; totalWords: number };
  readonly plan: Plan;
  readonly limit: number;
}

export interface SubscriptionServiceShape {
  readonly checkLimits: (
    userId: string
  ) => Effect.Effect<
    SubscriptionLimitStatus,
    BillingDatabaseError | LimitExceededError | UnknownError
  >;
  readonly getStatus: (
    userId: string
  ) => Effect.Effect<SubscriptionStatus, BillingDatabaseError | UnknownError>;
}

export class SubscriptionService extends Context.Service<
  SubscriptionService,
  SubscriptionServiceShape
>()("SubscriptionService") {}

export const SubscriptionServiceLive = Layer.effect(
  SubscriptionService,
  Effect.gen(function* () {
    const repository = yield* SubscriptionRepository;
    const usageReader = yield* UsageReader;

    const getPlan = (userId: string) =>
      repository.findCurrentByReferenceId(userId).pipe(
        Effect.map(
          (row) =>
            row ?? {
              plan: "free" as Plan,
              status: "free" as const,
              trialEnd: null,
              currentPeriodEnd: null,
            }
        )
      );

    return SubscriptionService.of({
      checkLimits: Effect.fnUntraced(function* (userId: string) {
        const { plan } = yield* getPlan(userId);

        if (plan === "pro") {
          return {
            usage: { spokenWords: 0, transformedWords: 0, totalWords: 0 },
            plan,
            limit: Infinity,
          };
        }

        const usage = yield* usageReader.getCurrentWeeklyUsage(userId);
        const limit = PLAN_WORD_LIMITS[plan];

        if (usage.totalWords >= limit) {
          return yield* new LimitExceededError({
            message: "Weekly word limit reached",
            usage: { totalWords: usage.totalWords, limit },
          });
        }

        return { usage, plan, limit };
      }),

      getStatus: Effect.fnUntraced(function* (userId: string) {
        const row = yield* repository.findLatestByReferenceId(userId);
        const usage = yield* usageReader.getCurrentWeeklyUsage(userId);
        return buildSubscriptionStatus(row, usage);
      }),
    });
  })
);
