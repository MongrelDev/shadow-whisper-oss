import { Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql/SqlClient";
import { computeLocalDateHour } from "../domain/usage-analytics";
import { UsageLedger } from "../application/usage-ledger-service";
import {
  appendSkillUsage,
  getAchievementsWithProgress,
  getDailyBreakdown,
  getMilestonesWithProgress,
  getShareCardStats,
  getUsageInsights,
  getUserStats,
  getWeeklyWordCount,
  recordUsage,
} from "../application/usage-ledger-operations";
import { makeLedgerStoresContext } from "./d1-ledger-stores";

export const UsageLedgerLive = Layer.effect(
  UsageLedger,
  Effect.gen(function* () {
    const sql = yield* SqlClient;
    const forUser = (userId: string) => makeLedgerStoresContext(sql, userId);

    return UsageLedger.of({
      recordUsage: (userId, input) =>
        recordUsage(input).pipe(Effect.provideContext(forUser(userId))),

      appendSkillUsage: (userId, input) => {
        const createdAt = Date.now();
        const { localDate, localHour } = computeLocalDateHour(createdAt, input.timezone);
        return appendSkillUsage({
          skillId: input.skillId,
          skillVersion: input.skillVersion,
          inputWordCount: input.inputWordCount,
          outputWordCount: input.outputWordCount,
          durationMs: input.durationMs,
          success: input.success ? 1 : 0,
          bundleId: input.bundleId ?? null,
          siteHost: input.siteHost ?? null,
          surfaceContext: input.surfaceContext ?? "editor",
          platform: input.platform,
          os: input.os,
          language: input.language,
          localDate,
          localHour,
          timezone: input.timezone,
          createdAt,
        }).pipe(Effect.provideContext(forUser(userId)));
      },

      getWeeklyWordCount: (userId, weekStartMs, weekEndMs) =>
        getWeeklyWordCount(weekStartMs, weekEndMs).pipe(Effect.provideContext(forUser(userId))),

      getUserStats: (userId) => getUserStats.pipe(Effect.provideContext(forUser(userId))),

      getShareCardStats: (userId) => getShareCardStats.pipe(Effect.provideContext(forUser(userId))),

      getUsageInsights: (userId, range) =>
        getUsageInsights(range).pipe(Effect.provideContext(forUser(userId))),

      getDailyBreakdown: (userId, fromLocalDate, toLocalDate) =>
        getDailyBreakdown(fromLocalDate, toLocalDate).pipe(Effect.provideContext(forUser(userId))),

      getAchievementsWithProgress: (userId) =>
        getAchievementsWithProgress.pipe(Effect.provideContext(forUser(userId))),

      getMilestonesWithProgress: (userId) =>
        getMilestonesWithProgress.pipe(Effect.provideContext(forUser(userId))),
    });
  })
);
