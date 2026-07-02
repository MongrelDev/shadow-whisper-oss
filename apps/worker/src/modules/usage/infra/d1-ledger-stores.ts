import { Context, Effect } from "effect";
import type { SqlClient } from "effect/unstable/sql/SqlClient";
import {
  ACHIEVEMENT_KEYS,
  MILESTONE_KEYS,
  primaryLanguage,
  type AchievementKey,
  type MilestoneKey,
} from "../domain/usage-analytics";
import { UsageLedgerStorageError } from "../errors";
import {
  AppVarietyStore,
  BadgeStore,
  EntryWriter,
  SnapshotReader,
  StatsReader,
  SummaryStore,
  type AppUsageAggregateRow,
  type AppVarietyStoreService,
  type BadgeRecord,
  type BadgeStoreService,
  type DailyBreakdownRow,
  type DimensionAggregateRow,
  type EntryWriterService,
  type HourAggregateRow,
  type InsightsRange,
  type LanguageWordTotalRow,
  type LocalDayAggregate,
  type SnapshotReaderService,
  type StatsReaderService,
  type SummaryStoreService,
  type UserSummaryRow,
} from "../application/ports/ledger-stores";
import { unknownMessage } from "../../../lib/unknown-message";

const fail = (op: string) => (e: unknown) =>
  new UsageLedgerStorageError({ op, message: unknownMessage(e) });

const num = (v: unknown): number => Number(v ?? 0);

type Row = Record<string, unknown>;

const makeD1EntryWriter = (sql: SqlClient, userId: string): EntryWriterService => ({
  insert: (r) =>
    sql`
      INSERT INTO usage_entries (
        id, user_id, word_count, bundle_id, site_host, surface_context, engines_json,
        duration_ms, created_at, input_word_count, platform, os, language,
        local_date, local_hour, timezone
      ) VALUES (
        ${r.id}, ${userId}, ${r.wordCount}, ${r.bundleId}, ${r.siteHost}, ${r.surfaceContext},
        ${r.enginesJson}, ${r.durationMs}, ${r.createdAt}, ${r.inputWordCount}, ${r.platform},
        ${r.os}, ${r.language}, ${r.localDate}, ${r.localHour}, ${r.timezone}
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `.pipe(
      Effect.map((rows) => rows.length > 0),
      Effect.mapError(fail("usage_entries.insert"))
    ),

  appendSkillUsage: (r) =>
    sql`
      INSERT INTO usage_entries (
        id, user_id, word_count, skill_id, skill_version, input_word_count, output_word_count,
        duration_ms, success, bundle_id, site_host, surface_context, engines_json, created_at,
        platform, os, language, local_date, local_hour, timezone
      ) VALUES (
        ${crypto.randomUUID()}, ${userId}, ${r.inputWordCount}, ${r.skillId}, ${r.skillVersion},
        ${r.inputWordCount}, ${r.outputWordCount}, ${r.durationMs}, ${r.success}, ${r.bundleId},
        ${r.siteHost}, ${r.surfaceContext}, ${null}, ${r.createdAt}, ${r.platform}, ${r.os},
        ${r.language}, ${r.localDate}, ${r.localHour}, ${r.timezone}
      )
    `.pipe(Effect.asVoid, Effect.mapError(fail("usage_entries.appendSkillUsage"))),
});

const makeD1EntryReaders = (sql: SqlClient, userId: string) => {
  const countSuccess = () =>
    sql`SELECT COUNT(*) AS c FROM usage_entries WHERE user_id = ${userId} AND success = 1`.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => num(rows[0]?.c)),
      Effect.mapError(fail("usage_entries.countSuccess"))
    );

  const sumAllWords = () =>
    sql`
      SELECT COALESCE(SUM(word_count), 0) AS s
      FROM usage_entries WHERE user_id = ${userId} AND success = 1
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => num(rows[0]?.s)),
      Effect.mapError(fail("usage_entries.sumAllWords"))
    );

  const sumTodayWordCountUtc = (todayUtc: string) =>
    sql`
      SELECT COALESCE(SUM(word_count), 0) AS s
      FROM usage_entries
      WHERE user_id = ${userId} AND success = 1
        AND date(created_at / 1000, 'unixepoch') = ${todayUtc}
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => num(rows[0]?.s)),
      Effect.mapError(fail("usage_entries.sumTodayWordCountUtc"))
    );

  const sumTodayWordCountLocal = (todayLocal: string) =>
    sql`
      SELECT COALESCE(SUM(word_count), 0) AS s
      FROM usage_entries
      WHERE user_id = ${userId} AND success = 1 AND local_date = ${todayLocal}
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => num(rows[0]?.s)),
      Effect.mapError(fail("usage_entries.sumTodayWordCountLocal"))
    );

  const aggregateLocalDays = (limit: number) =>
    sql`
      SELECT local_date AS day,
        COALESCE(SUM(word_count), 0) AS words,
        COALESCE(SUM(duration_ms), 0) AS durationMs
      FROM usage_entries
      WHERE user_id = ${userId} AND success = 1 AND skill_id IS NULL
      GROUP BY local_date
      ORDER BY local_date DESC
      LIMIT ${limit}
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) =>
        rows.map<LocalDayAggregate>((row) => ({
          day: String(row.day),
          words: num(row.words),
          durationMs: num(row.durationMs),
        }))
      ),
      Effect.mapError(fail("usage_entries.aggregateLocalDays"))
    );

  const recentActiveDaysDescUtc = (limit: number) =>
    sql`
      SELECT DISTINCT date(created_at / 1000, 'unixepoch') AS d
      FROM usage_entries
      WHERE user_id = ${userId} AND success = 1
      ORDER BY d DESC
      LIMIT ${limit}
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => rows.map((row) => String(row.d))),
      Effect.mapError(fail("usage_entries.recentActiveDaysDescUtc"))
    );

  const distinctActiveDays = () =>
    sql`
      SELECT COUNT(DISTINCT date(created_at / 1000, 'unixepoch')) AS c
      FROM usage_entries
      WHERE user_id = ${userId} AND success = 1
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => num(rows[0]?.c)),
      Effect.mapError(fail("usage_entries.distinctActiveDays"))
    );

  const maxWordCountAllTime = () =>
    sql`
      SELECT MAX(word_count) AS m FROM usage_entries
      WHERE user_id = ${userId} AND success = 1
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => num(rows[0]?.m)),
      Effect.mapError(fail("usage_entries.maxWordCountAllTime"))
    );

  const languageWordTotalsAllTime = () =>
    sql`
      SELECT language, COALESCE(SUM(word_count), 0) AS words
      FROM usage_entries
      WHERE user_id = ${userId} AND success = 1
        AND language IS NOT NULL AND TRIM(language) <> ''
      GROUP BY language
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) =>
        rows.flatMap<LanguageWordTotalRow>((row) =>
          row.language ? [{ language: String(row.language), words: num(row.words) }] : []
        )
      ),
      Effect.mapError(fail("usage_entries.languageWordTotalsAllTime"))
    );

  const distinctPrimaryLanguagesAllTime = () =>
    sql`
      SELECT DISTINCT language FROM usage_entries
      WHERE user_id = ${userId} AND success = 1
        AND language IS NOT NULL AND TRIM(language) <> ''
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => {
        const set = new Set<string>();
        for (const row of rows) {
          const p = primaryLanguage(row.language == null ? null : String(row.language));
          if (p) set.add(p);
        }
        return set.size;
      }),
      Effect.mapError(fail("usage_entries.distinctPrimaryLanguagesAllTime"))
    );

  const distinctSkillsAllTime = () =>
    sql`
      SELECT COUNT(DISTINCT skill_id) AS c FROM usage_entries
      WHERE user_id = ${userId} AND skill_id IS NOT NULL AND TRIM(skill_id) <> ''
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => num(rows[0]?.c)),
      Effect.mapError(fail("usage_entries.distinctSkillsAllTime"))
    );

  const distinctPlatformsToday = (todayUtc: string) =>
    sql`
      SELECT COUNT(DISTINCT platform) AS c FROM usage_entries
      WHERE user_id = ${userId} AND success = 1
        AND date(created_at / 1000, 'unixepoch') = ${todayUtc}
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => num(rows[0]?.c)),
      Effect.mapError(fail("usage_entries.distinctPlatformsToday"))
    );

  return {
    countSuccess,
    sumAllWords,
    sumTodayWordCountUtc,
    sumTodayWordCountLocal,
    aggregateLocalDays,
    recentActiveDaysDescUtc,
    distinctActiveDays,
    maxWordCountAllTime,
    languageWordTotalsAllTime,
    distinctPrimaryLanguagesAllTime,
    distinctSkillsAllTime,
    distinctPlatformsToday,
  };
};

const makeD1SnapshotReader = (sql: SqlClient, userId: string): SnapshotReaderService =>
  makeD1EntryReaders(sql, userId);

const makeD1StatsReader = (sql: SqlClient, userId: string): StatsReaderService => {
  const readers = makeD1EntryReaders(sql, userId);

  const rangeClause = (range: InsightsRange) => sql`
    user_id = ${userId} AND success = 1
    AND (${range.fromLocalDate} IS NULL OR local_date >= ${range.fromLocalDate})
    AND (${range.toLocalDate} IS NULL OR local_date <= ${range.toLocalDate})
  `;

  return {
    aggregateLocalDays: readers.aggregateLocalDays,
    recentActiveDaysDescUtc: readers.recentActiveDaysDescUtc,
    countSuccess: readers.countSuccess,
    distinctPrimaryLanguagesAllTime: readers.distinctPrimaryLanguagesAllTime,
    distinctSkillsAllTime: readers.distinctSkillsAllTime,

    dailyBreakdown: (fromLocalDate, toLocalDate) =>
      sql`
        SELECT local_date AS localDate, platform, os, bundle_id AS bundleId,
          site_host AS siteHost,
          SUM(word_count) AS wordCount,
          SUM(duration_ms) AS durationMs,
          COUNT(*) AS entryCount
        FROM usage_entries
        WHERE user_id = ${userId} AND success = 1
          AND local_date >= ${fromLocalDate} AND local_date <= ${toLocalDate}
        GROUP BY local_date, platform, os, bundle_id, site_host
        ORDER BY local_date
      `.pipe(
        Effect.map((rows: ReadonlyArray<Row>) =>
          rows.map<DailyBreakdownRow>((row) => ({
            localDate: String(row.localDate),
            platform: String(row.platform),
            os: String(row.os),
            bundleId: row.bundleId == null ? null : String(row.bundleId),
            siteHost: row.siteHost == null ? null : String(row.siteHost),
            wordCount: num(row.wordCount),
            durationMs: num(row.durationMs),
            entryCount: num(row.entryCount),
          }))
        ),
        Effect.mapError(fail("usage_entries.dailyBreakdown"))
      ),

    weeklyWordCount: (weekStartMs, weekEndMs) =>
      sql`
        SELECT COALESCE(SUM(word_count), 0) AS s
        FROM usage_entries
        WHERE user_id = ${userId} AND skill_id IS NULL
          AND created_at >= ${weekStartMs} AND created_at <= ${weekEndMs}
      `.pipe(
        Effect.map((rows: ReadonlyArray<Row>) => num(rows[0]?.s)),
        Effect.mapError(fail("usage_entries.weeklyWordCount"))
      ),

    sumAllDuration: () =>
      sql`
        SELECT COALESCE(SUM(duration_ms), 0) AS s
        FROM usage_entries WHERE user_id = ${userId} AND success = 1
      `.pipe(
        Effect.map((rows: ReadonlyArray<Row>) => num(rows[0]?.s)),
        Effect.mapError(fail("usage_entries.sumAllDuration"))
      ),

    minCreatedAt: () =>
      sql`
        SELECT MIN(created_at) AS m FROM usage_entries
        WHERE user_id = ${userId} AND success = 1
      `.pipe(
        Effect.map((rows: ReadonlyArray<Row>) => (rows[0]?.m == null ? null : num(rows[0].m))),
        Effect.mapError(fail("usage_entries.minCreatedAt"))
      ),

    maxSpeakingWpm: () =>
      sql`
        SELECT MAX(
          CAST(COALESCE(input_word_count, word_count) AS REAL) / (duration_ms / 60000.0)
        ) AS m
        FROM usage_entries
        WHERE user_id = ${userId} AND success = 1
          AND duration_ms >= 60000
          AND COALESCE(input_word_count, word_count) >= 50
      `.pipe(
        Effect.map((rows: ReadonlyArray<Row>) => Math.round(num(rows[0]?.m))),
        Effect.mapError(fail("usage_entries.maxSpeakingWpm"))
      ),

    appUsageAggregate: (range) =>
      sql`
        SELECT bundle_id AS bundleId, site_host AS siteHost,
          COALESCE(SUM(word_count), 0) AS wordCount,
          COALESCE(SUM(duration_ms), 0) AS durationMs,
          COUNT(*) AS entryCount
        FROM usage_entries
        WHERE ${rangeClause(range)}
        GROUP BY bundle_id, site_host
      `.pipe(
        Effect.map((rows: ReadonlyArray<Row>) =>
          rows.map<AppUsageAggregateRow>((row) => ({
            bundleId: row.bundleId == null ? null : String(row.bundleId),
            siteHost: row.siteHost == null ? null : String(row.siteHost),
            wordCount: num(row.wordCount),
            durationMs: num(row.durationMs),
            entryCount: num(row.entryCount),
          }))
        ),
        Effect.mapError(fail("usage_entries.appUsageAggregate"))
      ),

    platformAggregate: (range) =>
      sql`
        SELECT platform AS key,
          COALESCE(SUM(word_count), 0) AS wordCount,
          COUNT(*) AS entryCount
        FROM usage_entries
        WHERE ${rangeClause(range)}
        GROUP BY platform
      `.pipe(
        Effect.map((rows: ReadonlyArray<Row>) =>
          rows.map<DimensionAggregateRow>((row) => ({
            key: String(row.key),
            wordCount: num(row.wordCount),
            entryCount: num(row.entryCount),
          }))
        ),
        Effect.mapError(fail("usage_entries.platformAggregate"))
      ),

    languageAggregate: (range) =>
      sql`
        SELECT language AS key,
          COALESCE(SUM(word_count), 0) AS wordCount,
          COUNT(*) AS entryCount
        FROM usage_entries
        WHERE ${rangeClause(range)}
          AND language IS NOT NULL AND TRIM(language) <> ''
        GROUP BY language
      `.pipe(
        Effect.map((rows: ReadonlyArray<Row>) => {
          const byPrimary = new Map<string, { wordCount: number; entryCount: number }>();
          for (const row of rows) {
            const p = primaryLanguage(row.key == null ? null : String(row.key));
            if (!p) continue;
            const acc = byPrimary.get(p) ?? { wordCount: 0, entryCount: 0 };
            acc.wordCount += num(row.wordCount);
            acc.entryCount += num(row.entryCount);
            byPrimary.set(p, acc);
          }
          return Array.from(byPrimary, ([key, agg]) => ({ key, ...agg }));
        }),
        Effect.mapError(fail("usage_entries.languageAggregate"))
      ),

    hourAggregate: (range) =>
      sql`
        SELECT local_hour AS hour,
          COALESCE(SUM(word_count), 0) AS wordCount,
          COUNT(*) AS entryCount
        FROM usage_entries
        WHERE ${rangeClause(range)}
        GROUP BY local_hour
        ORDER BY local_hour
      `.pipe(
        Effect.map((rows: ReadonlyArray<Row>) =>
          rows.map<HourAggregateRow>((row) => ({
            hour: num(row.hour),
            wordCount: num(row.wordCount),
            entryCount: num(row.entryCount),
          }))
        ),
        Effect.mapError(fail("usage_entries.hourAggregate"))
      ),

    rangeTotals: (range) =>
      sql`
        SELECT COALESCE(SUM(word_count), 0) AS wordCount,
          COALESCE(SUM(duration_ms), 0) AS durationMs,
          COUNT(*) AS entryCount
        FROM usage_entries
        WHERE ${rangeClause(range)}
      `.pipe(
        Effect.map((rows: ReadonlyArray<Row>) => ({
          wordCount: num(rows[0]?.wordCount),
          durationMs: num(rows[0]?.durationMs),
          entryCount: num(rows[0]?.entryCount),
        })),
        Effect.mapError(fail("usage_entries.rangeTotals"))
      ),
  };
};

const ACHIEVEMENT_KEY_SET = new Set<string>(ACHIEVEMENT_KEYS);
const MILESTONE_KEY_SET = new Set<string>(MILESTONE_KEYS);

const makeD1BadgeStore = (sql: SqlClient, userId: string): BadgeStoreService => ({
  tryAward: (key, earnedAt, contextJson) =>
    sql`
      INSERT INTO user_achievements (user_id, achievement_key, earned_at, context_json)
      VALUES (${userId}, ${key}, ${earnedAt}, ${contextJson})
      ON CONFLICT (user_id, achievement_key) DO NOTHING
      RETURNING achievement_key
    `.pipe(
      Effect.map((rows) => rows.length > 0),
      Effect.mapError(fail("user_achievements.tryAward"))
    ),

  listEarnedAchievements: () =>
    sql`
      SELECT achievement_key AS achievementKey, earned_at AS earnedAt, context_json AS contextJson
      FROM user_achievements WHERE user_id = ${userId}
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => {
        const out = new Map<AchievementKey, BadgeRecord>();
        for (const row of rows) {
          const key = String(row.achievementKey);
          if (!ACHIEVEMENT_KEY_SET.has(key)) continue;
          out.set(key as AchievementKey, {
            earnedAt: num(row.earnedAt),
            contextJson: row.contextJson == null ? null : String(row.contextJson),
          });
        }
        return out;
      }),
      Effect.mapError(fail("user_achievements.listEarnedAchievements"))
    ),

  listEarnedMilestones: () =>
    sql`
      SELECT achievement_key AS achievementKey, earned_at AS earnedAt, context_json AS contextJson
      FROM user_achievements
      WHERE user_id = ${userId} AND achievement_key LIKE 'milestone_%'
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => {
        const out = new Map<MilestoneKey, BadgeRecord>();
        for (const row of rows) {
          const key = String(row.achievementKey);
          if (!MILESTONE_KEY_SET.has(key)) continue;
          out.set(key as MilestoneKey, {
            earnedAt: num(row.earnedAt),
            contextJson: row.contextJson == null ? null : String(row.contextJson),
          });
        }
        return out;
      }),
      Effect.mapError(fail("user_achievements.listEarnedMilestones"))
    ),
});

const SUMMARY_DEFAULTS: UserSummaryRow = { totalWords: 0, allTimeDailyBest: 0, maxStreak: 0 };

const makeD1SummaryStore = (sql: SqlClient, userId: string): SummaryStoreService => ({
  get: () =>
    sql`
      SELECT total_words AS totalWords, all_time_daily_best AS allTimeDailyBest,
        max_streak AS maxStreak
      FROM user_summary WHERE user_id = ${userId}
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => {
        const row = rows[0];
        if (!row) return SUMMARY_DEFAULTS;
        return {
          totalWords: num(row.totalWords),
          allTimeDailyBest: num(row.allTimeDailyBest),
          maxStreak: num(row.maxStreak),
        };
      }),
      Effect.mapError(fail("user_summary.get"))
    ),

  incrementTotalWords: (added) =>
    sql`
      INSERT INTO user_summary (user_id, total_words) VALUES (${userId}, ${added})
      ON CONFLICT (user_id) DO UPDATE SET total_words = user_summary.total_words + ${added}
      RETURNING total_words AS totalWords
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => {
        const newTotal = num(rows[0]?.totalWords ?? added);
        return { prevTotal: newTotal - added, newTotal };
      }),
      Effect.mapError(fail("user_summary.incrementTotalWords"))
    ),

  raiseMaxStreak: (streak) =>
    sql`
      INSERT INTO user_summary (user_id, max_streak) VALUES (${userId}, ${streak})
      ON CONFLICT (user_id) DO UPDATE SET max_streak = max(user_summary.max_streak, ${streak})
    `.pipe(Effect.asVoid, Effect.mapError(fail("user_summary.raiseMaxStreak"))),
});

const makeD1AppVarietyStore = (sql: SqlClient, userId: string): AppVarietyStoreService => ({
  track: (todayUtc, identifier) =>
    sql`
      INSERT INTO app_variety_today (user_id, local_date, identifier)
      VALUES (${userId}, ${todayUtc}, ${identifier})
      ON CONFLICT (user_id, local_date, identifier) DO NOTHING
    `.pipe(Effect.asVoid, Effect.mapError(fail("app_variety_today.track"))),

  countDistinctToday: (todayUtc) =>
    sql`
      SELECT COUNT(DISTINCT identifier) AS c FROM app_variety_today
      WHERE user_id = ${userId} AND local_date = ${todayUtc}
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => num(rows[0]?.c)),
      Effect.mapError(fail("app_variety_today.countDistinctToday"))
    ),
});

export const makeLedgerStoresContext = (sql: SqlClient, userId: string) =>
  Context.make(EntryWriter, makeD1EntryWriter(sql, userId)).pipe(
    Context.add(SnapshotReader, makeD1SnapshotReader(sql, userId)),
    Context.add(StatsReader, makeD1StatsReader(sql, userId)),
    Context.add(BadgeStore, makeD1BadgeStore(sql, userId)),
    Context.add(SummaryStore, makeD1SummaryStore(sql, userId)),
    Context.add(AppVarietyStore, makeD1AppVarietyStore(sql, userId))
  );
