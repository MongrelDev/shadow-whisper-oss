import { Context, Effect, Layer } from "effect";
import { AppCategoryRepository } from "../../transcription/application/ports/app-category-repository";
import type { ShareCardStats } from "./usage-ledger-operations";
import type { AchievementRow, MilestoneRow, UserStats } from "../domain/usage-analytics";
import type { UsageLedgerReaderError } from "../errors";
import type { UsageStatsReaderError } from "../errors";
import type { AppCategoryError } from "../../transcription/errors";
import type { DailyBreakdownItem, UsageInsightsResponse } from "../schemas";
import {
  UsageLedgerReaderError as LedgerError,
  UsageStatsReaderError as StatsError,
} from "../errors";
import { UsageLedger } from "./usage-ledger-service";
import { resolveDailyBreakdownItems } from "./daily-breakdown-resolver";
import { resolveUsageInsights } from "./usage-insights-resolver";

export interface GetAchievementsInput {
  readonly userId: string;
}

export interface GetDailyBreakdownInput {
  readonly userId: string;
  readonly fromLocalDate: string;
  readonly toLocalDate: string;
}

export interface GetUserStatsInput {
  readonly userId: string;
}

export interface GetShareCardStatsInput {
  readonly userId: string;
}

export interface GetUsageInsightsInput {
  readonly userId: string;
  readonly fromLocalDate: string | null;
  readonly toLocalDate: string | null;
}

export interface ShareCardStatsResult extends ShareCardStats {
  readonly achievements: ReadonlyArray<AchievementRow>;
  readonly milestones: ReadonlyArray<MilestoneRow>;
}

export interface UsageAnalyticsServiceShape {
  readonly getAchievements: (
    input: GetAchievementsInput
  ) => Effect.Effect<{ items: ReadonlyArray<AchievementRow> }, UsageLedgerReaderError>;
  readonly getDailyBreakdown: (
    input: GetDailyBreakdownInput
  ) => Effect.Effect<ReadonlyArray<DailyBreakdownItem>, UsageLedgerReaderError | AppCategoryError>;
  readonly getUserStats: (input: GetUserStatsInput) => Effect.Effect<
    UserStats & {
      achievements: ReadonlyArray<AchievementRow>;
      milestones: ReadonlyArray<MilestoneRow>;
    },
    UsageStatsReaderError | UsageLedgerReaderError
  >;
  readonly getShareCardStats: (
    input: GetShareCardStatsInput
  ) => Effect.Effect<ShareCardStatsResult, UsageStatsReaderError | UsageLedgerReaderError>;
  readonly getUsageInsights: (
    input: GetUsageInsightsInput
  ) => Effect.Effect<UsageInsightsResponse, UsageLedgerReaderError | AppCategoryError>;
}

export class UsageAnalyticsService extends Context.Service<
  UsageAnalyticsService,
  UsageAnalyticsServiceShape
>()("UsageAnalyticsService") {}

export const UsageAnalyticsServiceLive = Layer.effect(
  UsageAnalyticsService,
  Effect.gen(function* () {
    const registry = yield* AppCategoryRepository;
    const ledger = yield* UsageLedger;

    const asLedgerError = (op: string) => (e: { readonly message: string }) =>
      new LedgerError({ message: `${op} failed: ${e.message}` });
    const asStatsError = (op: string) => (e: { readonly message: string }) =>
      new StatsError({ message: `${op} failed: ${e.message}` });

    return UsageAnalyticsService.of({
      getAchievements: (input) =>
        ledger.getAchievementsWithProgress(input.userId).pipe(
          Effect.mapError(asLedgerError("getAchievements")),
          Effect.map((items) => ({ items }))
        ),

      getUsageInsights: (input) =>
        Effect.gen(function* () {
          const insights = yield* ledger
            .getUsageInsights(input.userId, {
              fromLocalDate: input.fromLocalDate,
              toLocalDate: input.toLocalDate,
            })
            .pipe(Effect.mapError(asLedgerError("getUsageInsights")));
          return yield* resolveUsageInsights(
            insights,
            { from: input.fromLocalDate, to: input.toLocalDate },
            registry
          );
        }),

      getDailyBreakdown: (input) =>
        Effect.gen(function* () {
          const rows = yield* ledger
            .getDailyBreakdown(input.userId, input.fromLocalDate, input.toLocalDate)
            .pipe(Effect.mapError(asLedgerError("getDailyBreakdown")));
          return yield* resolveDailyBreakdownItems(rows, registry);
        }),

      getUserStats: (input) =>
        Effect.gen(function* () {
          const [stats, achievements, milestones] = yield* Effect.all(
            [
              ledger.getUserStats(input.userId).pipe(Effect.mapError(asStatsError("getUserStats"))),
              ledger
                .getAchievementsWithProgress(input.userId)
                .pipe(Effect.mapError(asLedgerError("getAchievements"))),
              ledger
                .getMilestonesWithProgress(input.userId)
                .pipe(Effect.mapError(asLedgerError("getMilestones"))),
            ],
            { concurrency: "unbounded" }
          );
          return { ...stats, achievements, milestones };
        }),

      getShareCardStats: (input) =>
        Effect.gen(function* () {
          const [stats, achievements, milestones] = yield* Effect.all(
            [
              ledger
                .getShareCardStats(input.userId)
                .pipe(Effect.mapError(asStatsError("getShareCardStats"))),
              ledger
                .getAchievementsWithProgress(input.userId)
                .pipe(Effect.mapError(asLedgerError("getAchievements"))),
              ledger
                .getMilestonesWithProgress(input.userId)
                .pipe(Effect.mapError(asLedgerError("getMilestones"))),
            ],
            { concurrency: "unbounded" }
          );
          return { ...stats, achievements, milestones };
        }),
    });
  })
);
