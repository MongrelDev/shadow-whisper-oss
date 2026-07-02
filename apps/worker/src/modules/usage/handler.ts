import { Effect, Schema } from "effect";
import { Hono } from "hono";
import { currentUserId } from "../auth/application/current-user";
import { httpUnauthorized, validationResponse } from "../../lib/http-errors";
import { UsageAnalyticsService } from "./application/usage-analytics-service";
import { runUsageHandler } from "./runtime";
import {
  AchievementsResponse,
  DailyBreakdownQuery,
  ShareCardStatsResponse,
  UsageInsightsQuery,
  UsageInsightsResponse,
  UserStatsResponse,
  type AchievementItem,
  type DailyBreakdownResponse,
} from "./schemas";

function achievementDateOf(achievement: AchievementItem): string | null {
  if (achievement.earnedAt === null) return null;
  return new Date(achievement.earnedAt).toISOString().slice(0, 10);
}

function achievementDatesInRange(
  achievements: ReadonlyArray<AchievementItem>,
  from: string,
  to: string
): string[] {
  const dates = new Set<string>();
  for (const achievement of achievements) {
    const date = achievementDateOf(achievement);
    if (date !== null && date >= from && date <= to) dates.add(date);
  }
  return Array.from(dates).sort();
}

const usage = new Hono<{ Bindings: Env }>()
  .get("/insights", (c) => {
    const unauthorized = httpUnauthorized(c);
    const rawFrom = c.req.query("from");
    const rawTo = c.req.query("to");

    return runUsageHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        const analytics = yield* UsageAnalyticsService;
        const parsed = yield* Schema.decodeUnknownEffect(UsageInsightsQuery)({
          ...(rawFrom ? { from: rawFrom } : {}),
          ...(rawTo ? { to: rawTo } : {}),
        });
        const result = yield* analytics.getUsageInsights({
          userId,
          fromLocalDate: parsed.from ?? null,
          toLocalDate: parsed.to ?? null,
        });
        const response = yield* Schema.encodeEffect(UsageInsightsResponse)(result);
        return c.json(response);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          SchemaError: (e) => Effect.succeed(validationResponse(c, `invalid query: ${String(e)}`)),
          UsageLedgerReaderError: () => Effect.succeed(c.text("data load failed", 500)),
          AppCategoryError: () => Effect.succeed(c.text("data load failed", 500)),
        })
      ),
      "usage.insights"
    );
  })
  .get("/daily", (c) => {
    const unauthorized = httpUnauthorized(c);
    const rawFrom = c.req.query("from") ?? "";
    const rawTo = c.req.query("to") ?? "";

    return runUsageHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        const analytics = yield* UsageAnalyticsService;
        const parsed = yield* Schema.decodeUnknownEffect(DailyBreakdownQuery)({
          from: rawFrom,
          to: rawTo,
        });

        const fromMs = new Date(`${parsed.from}T00:00:00Z`).getTime();
        const toMs = new Date(`${parsed.to}T00:00:00Z`).getTime();
        const MAX_RANGE_DAYS = 371;
        const clampedFrom =
          toMs - fromMs > MAX_RANGE_DAYS * 86_400_000
            ? new Date(toMs - MAX_RANGE_DAYS * 86_400_000).toISOString().slice(0, 10)
            : parsed.from;

        const [items, achievements] = yield* Effect.all(
          [
            analytics.getDailyBreakdown({
              userId,
              fromLocalDate: clampedFrom,
              toLocalDate: parsed.to,
            }),
            analytics.getAchievements({ userId }),
          ],
          { concurrency: 2 }
        );
        const response: DailyBreakdownResponse = {
          from: clampedFrom,
          to: parsed.to,
          items,
          achievementDates: achievementDatesInRange(achievements.items, clampedFrom, parsed.to),
        };
        return c.json(response);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          SchemaError: (e) => Effect.succeed(validationResponse(c, `invalid query: ${String(e)}`)),
          UsageLedgerReaderError: () => Effect.succeed(c.text("data load failed", 500)),
          AppCategoryError: () => Effect.succeed(c.text("data load failed", 500)),
        })
      ),
      "usage.daily"
    );
  })
  .get("/achievements", (c) => {
    const unauthorized = httpUnauthorized(c);
    return runUsageHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        const analytics = yield* UsageAnalyticsService;
        const result = yield* analytics.getAchievements({ userId });
        const response = yield* Schema.encodeEffect(AchievementsResponse)(result);
        return c.json(response);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          UsageLedgerReaderError: () => Effect.succeed(c.text("data load failed", 500)),
        })
      ),
      "usage.achievements"
    );
  })
  .get("/stats", (c) => {
    const unauthorized = httpUnauthorized(c);
    return runUsageHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        const analytics = yield* UsageAnalyticsService;
        const result = yield* analytics.getUserStats({ userId });
        const response = yield* Schema.encodeEffect(UserStatsResponse)({
          currentStreak: result.currentStreak,
          weeklyAvgWpm: result.weeklyAvgWpm,
          totalWords: result.totalWords,
          isFirstWeek: result.isFirstWeek,
          hasAnyEntries: result.hasAnyEntries,
          achievements: result.achievements,
          milestones: result.milestones,
        });
        return c.json(response);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          UsageStatsReaderError: () => Effect.succeed(c.text("data load failed", 500)),
          UsageLedgerReaderError: () => Effect.succeed(c.text("data load failed", 500)),
        })
      ),
      "usage.stats"
    );
  })
  .get("/share-card", (c) => {
    const unauthorized = httpUnauthorized(c);
    return runUsageHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        const analytics = yield* UsageAnalyticsService;
        const result = yield* analytics.getShareCardStats({ userId });
        const response = yield* Schema.encodeEffect(ShareCardStatsResponse)(result);
        return c.json(response);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          UsageStatsReaderError: () => Effect.succeed(c.text("data load failed", 500)),
          UsageLedgerReaderError: () => Effect.succeed(c.text("data load failed", 500)),
        })
      ),
      "usage.shareCard"
    );
  });

export default usage;
