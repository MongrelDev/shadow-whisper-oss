import { Effect } from "effect";
import {
  ACHIEVEMENT_KEYS,
  ACHIEVEMENT_RULES,
  BILINGUAL_MIN_WORDS_PER_LANGUAGE,
  MILESTONE_KEYS,
  computeLocalDateHour,
  computeStreak,
  computeWpm,
  countQualifyingLanguages,
  evaluateMilestoneCrossings,
  subtractDays,
  utcDateString,
  type AchievementKey,
  type AchievementRow,
  type MilestoneRow,
  type ProgressSnapshot,
  type RecordUsageResult,
  type RecordUsageStats,
  type UnlockedAchievement,
  type UnlockedMilestone,
  type UnlockSnapshot,
} from "../domain/usage-analytics";
import {
  AppVarietyStore,
  BadgeStore,
  EntryWriter,
  SnapshotReader,
  StatsReader,
  SummaryStore,
} from "./ports/ledger-stores";
import type {
  AppUsageAggregateRow,
  DimensionAggregateRow,
  HourAggregateRow,
  InsightsRange,
  LocalDayAggregate,
  SkillUsageRow,
} from "./ports/ledger-stores";

export interface RecordUsageInput {
  readonly id: string;
  readonly wordCount: number;
  readonly bundleId: string | null;
  readonly siteHost: string | null;
  readonly surfaceContext: string | null;
  readonly enginesJson: string;
  readonly durationMs: number;
  readonly createdAt: number;
  readonly platform: "desktop" | "extension";
  readonly os: string;
  readonly language: string | null;
  readonly timezone: string;
  readonly inputWordCount?: number | null;
}

const LOCAL_DAYS_LOOKBACK = 400;
const STREAK_DAYS_LOOKBACK = 400;

interface CoreStats {
  readonly totalWords: number;
  readonly currentStreak: number;
  readonly weekWordCount: number;
  readonly weeklyAvgWpm: number;
  readonly isFirstWeek: boolean;
  readonly hasAnyEntries: boolean;
}

const sumWords = (rows: ReadonlyArray<LocalDayAggregate>): number => {
  let total = 0;
  for (const r of rows) total += r.words;
  return total;
};

const weekTotals = (
  rows: ReadonlyArray<LocalDayAggregate>,
  todayLocal: string
): { words: number; durationMs: number } => {
  const weekFrom = subtractDays(todayLocal, 6);
  let words = 0;
  let durationMs = 0;
  for (const r of rows) {
    if (r.day >= weekFrom && r.day <= todayLocal) {
      words += r.words;
      durationMs += r.durationMs;
    }
  }
  return { words, durationMs };
};

const computeCoreStats = (
  rows: ReadonlyArray<LocalDayAggregate>,
  recentDays: ReadonlyArray<string>,
  todayUtc: string
): CoreStats => {
  const totalWords = sumWords(rows);
  const currentStreak = computeStreak(recentDays, todayUtc);
  const todayLocal = rows[0]?.day ?? todayUtc;
  const week = weekTotals(rows, todayLocal);
  const minutes = Math.max(week.durationMs / 60_000, 1);

  return {
    totalWords,
    currentStreak,
    weekWordCount: week.words,
    weeklyAvgWpm: Math.round(week.words / minutes),
    isFirstWeek: rows.length < 7,
    hasAnyEntries: rows.length > 0,
  };
};

export const getWeeklyWordCount = Effect.fnUntraced(function* (
  weekStartMs: number,
  weekEndMs: number
) {
  const stats = yield* StatsReader;
  return yield* stats.weeklyWordCount(weekStartMs, weekEndMs);
});

export const getDailyBreakdown = Effect.fnUntraced(function* (
  fromLocalDate: string,
  toLocalDate: string
) {
  const stats = yield* StatsReader;
  return yield* stats.dailyBreakdown(fromLocalDate, toLocalDate);
});

export const getUserStats = Effect.gen(function* () {
  const stats = yield* StatsReader;
  const [rows, recentDays] = yield* Effect.all(
    [
      stats.aggregateLocalDays(LOCAL_DAYS_LOOKBACK),
      stats.recentActiveDaysDescUtc(STREAK_DAYS_LOOKBACK),
    ],
    { concurrency: 2 }
  );
  const core = computeCoreStats(rows, recentDays, utcDateString(Date.now()));
  return {
    currentStreak: core.currentStreak,
    weeklyAvgWpm: core.weeklyAvgWpm,
    totalWords: core.totalWords,
    isFirstWeek: core.isFirstWeek,
    hasAnyEntries: core.hasAnyEntries,
  };
});

export const getMilestonesWithProgress = Effect.gen(function* () {
  const store = yield* BadgeStore;
  const earned = yield* store.listEarnedMilestones();
  return MILESTONE_KEYS.map<MilestoneRow>((key) => {
    const hit = earned.get(key);
    return {
      key,
      earnedAt: hit ? hit.earnedAt : null,
      contextJson: hit ? hit.contextJson : null,
    };
  });
});

const buildProgressSnapshot = Effect.fnUntraced(function* (todayUtc: string) {
  const entries = yield* SnapshotReader;
  const variety = yield* AppVarietyStore;
  const [
    successEntryCount,
    recentDays,
    todayWordCountUtc,
    bestSessionWordsAllTime,
    distinctAppsToday,
    languageWordTotals,
    distinctSkillsAllTime,
    distinctPlatformsToday,
  ] = yield* Effect.all(
    [
      entries.countSuccess(),
      entries.recentActiveDaysDescUtc(STREAK_DAYS_LOOKBACK),
      entries.sumTodayWordCountUtc(todayUtc),
      entries.maxWordCountAllTime(),
      variety.countDistinctToday(todayUtc),
      entries.languageWordTotalsAllTime(),
      entries.distinctSkillsAllTime(),
      entries.distinctPlatformsToday(todayUtc),
    ],
    { concurrency: "unbounded" }
  );
  const currentStreak = computeStreak(recentDays, todayUtc);
  const snap: ProgressSnapshot & { readonly todayUtc: string } = {
    todayUtc,
    successEntryCount,
    currentStreak,
    todayWordCountUtc,
    bestSessionWordsAllTime,
    distinctAppsToday,
    qualifyingLanguagesAllTime: countQualifyingLanguages(
      languageWordTotals,
      BILINGUAL_MIN_WORDS_PER_LANGUAGE
    ),
    distinctSkillsAllTime,
    distinctPlatformsToday,
  };
  return snap;
});

export const getAchievementsWithProgress = Effect.gen(function* () {
  const store = yield* BadgeStore;
  const todayUtc = utcDateString(Date.now());
  const earned = yield* store.listEarnedAchievements();
  const snap = yield* buildProgressSnapshot(todayUtc);
  const rulesByKey = new Map(ACHIEVEMENT_RULES.map((r) => [r.key, r]));
  return ACHIEVEMENT_KEYS.map<AchievementRow>((key) => {
    const hit = earned.get(key as AchievementKey);
    if (hit) {
      return { key, earnedAt: hit.earnedAt, contextJson: hit.contextJson };
    }
    const rule = rulesByKey.get(key);
    const progress = rule?.progress(snap);
    return {
      key,
      earnedAt: null,
      contextJson: null,
      ...(progress ? { progress } : {}),
    };
  });
});

export const appendSkillUsage = Effect.fnUntraced(function* (row: SkillUsageRow) {
  const writer = yield* EntryWriter;
  yield* writer.appendSkillUsage(row);

  const reader = yield* SnapshotReader;
  const distinctSkills = yield* reader.distinctSkillsAllTime();
  if (distinctSkills >= 3) {
    const badges = yield* BadgeStore;
    // @effect-diagnostics-next-line preferSchemaOverJson:off
    yield* badges.tryAward("skill_explorer", row.createdAt, JSON.stringify({ distinctSkills }));
  }
});

const normalizeIdentifier = (v: string | null): string | null => {
  if (!v) return null;
  const t = v.trim().toLowerCase();
  return t.length > 0 ? t : null;
};

const trackAppVarietyFromInput = Effect.fnUntraced(function* (
  input: RecordUsageInput,
  todayUtc: string
) {
  const variety = yield* AppVarietyStore;
  const host = normalizeIdentifier(input.siteHost);
  if (host) return yield* variety.track(todayUtc, `host:${host}`);
  const bundle = normalizeIdentifier(input.bundleId);
  if (bundle) return yield* variety.track(todayUtc, `bundle:${bundle}`);
});

const bumpTotalWords = Effect.fnUntraced(function* (added: number) {
  const summary = yield* SummaryStore;
  return yield* summary.incrementTotalWords(added);
});

interface RecordUsageReadout extends ProgressSnapshot {
  readonly localDayRows: ReadonlyArray<LocalDayAggregate>;
  readonly todayWordCountLocal: number;
}

const readRecordUsageSnapshot = Effect.fnUntraced(function* (localDate: string, todayUtc: string) {
  const entries = yield* SnapshotReader;
  const variety = yield* AppVarietyStore;
  const [
    successEntryCount,
    recentDays,
    todayWordCountUtc,
    todayWordCountLocal,
    bestSessionWordsAllTime,
    distinctAppsToday,
    languageWordTotals,
    distinctSkillsAllTime,
    distinctPlatformsToday,
    localDayRows,
  ] = yield* Effect.all(
    [
      entries.countSuccess(),
      entries.recentActiveDaysDescUtc(STREAK_DAYS_LOOKBACK),
      entries.sumTodayWordCountUtc(todayUtc),
      entries.sumTodayWordCountLocal(localDate),
      entries.maxWordCountAllTime(),
      variety.countDistinctToday(todayUtc),
      entries.languageWordTotalsAllTime(),
      entries.distinctSkillsAllTime(),
      entries.distinctPlatformsToday(todayUtc),
      entries.aggregateLocalDays(LOCAL_DAYS_LOOKBACK),
    ],
    { concurrency: "unbounded" }
  );
  const currentStreak = computeStreak(recentDays, todayUtc);
  const readout: RecordUsageReadout = {
    todayUtc,
    successEntryCount,
    currentStreak,
    todayWordCountUtc,
    bestSessionWordsAllTime,
    distinctAppsToday,
    qualifyingLanguagesAllTime: countQualifyingLanguages(
      languageWordTotals,
      BILINGUAL_MIN_WORDS_PER_LANGUAGE
    ),
    distinctSkillsAllTime,
    distinctPlatformsToday,
    localDayRows,
    todayWordCountLocal,
  };
  return readout;
});

const awardAchievements = Effect.fnUntraced(function* (snap: UnlockSnapshot, earnedAt: number) {
  const badges = yield* BadgeStore;
  const unlocked: Array<UnlockedAchievement> = [];
  for (const rule of ACHIEVEMENT_RULES) {
    const outcome = rule.evaluate(snap);
    if (!outcome) continue;
    const won = yield* badges.tryAward(rule.key, earnedAt, outcome.contextJson);
    if (won) {
      unlocked.push({ key: rule.key, earnedAt, contextJson: outcome.contextJson });
    }
  }
  return unlocked;
});

const awardMilestones = Effect.fnUntraced(function* (
  prevTotal: number,
  newTotal: number,
  earnedAt: number
) {
  const badges = yield* BadgeStore;
  const unlocked: Array<UnlockedMilestone> = [];
  for (const crossing of evaluateMilestoneCrossings(prevTotal, newTotal)) {
    const won = yield* badges.tryAward(crossing.key, earnedAt, crossing.contextJson);
    if (won) {
      unlocked.push({
        key: crossing.key,
        earnedAt,
        contextJson: crossing.contextJson,
      });
    }
  }
  return unlocked;
});

const maybeUpdateMaxStreak = Effect.fnUntraced(function* (currentStreak: number) {
  const summary = yield* SummaryStore;
  yield* summary.raiseMaxStreak(currentStreak);
});

const computeRecordUsageStats = (
  input: RecordUsageInput,
  inputWordCount: number | null,
  readout: RecordUsageReadout,
  todayUtc: string
): RecordUsageStats => {
  const core = computeCoreStats(readout.localDayRows, [], todayUtc);
  const wpm = computeWpm(inputWordCount ?? input.wordCount, input.durationMs);
  return {
    todayWordCount: readout.todayWordCountLocal,
    weekWordCount: core.weekWordCount,
    currentStreak: readout.currentStreak,
    wpm,
    hasAnyEntries: true,
    totalWords: core.totalWords,
    weeklyAvgWpm: core.weeklyAvgWpm,
    isFirstWeek: core.isFirstWeek,
  };
};

export const recordUsage = Effect.fnUntraced(function* (input: RecordUsageInput) {
  const inputWordCount = input.inputWordCount ?? null;
  const { localDate, localHour } = computeLocalDateHour(input.createdAt, input.timezone);
  const todayUtc = utcDateString(input.createdAt);

  const writer = yield* EntryWriter;
  const wasInserted = yield* writer.insert({
    id: input.id,
    wordCount: input.wordCount,
    bundleId: input.bundleId,
    siteHost: input.siteHost,
    surfaceContext: input.surfaceContext,
    enginesJson: input.enginesJson,
    durationMs: input.durationMs,
    createdAt: input.createdAt,
    platform: input.platform,
    os: input.os,
    language: input.language,
    inputWordCount,
    localDate,
    localHour,
    timezone: input.timezone,
  });

  if (!wasInserted) {
    const readout = yield* readRecordUsageSnapshot(localDate, todayUtc);
    const stats = computeRecordUsageStats(input, inputWordCount, readout, todayUtc);
    return { unlockedAchievements: [], unlockedMilestones: [], stats } as RecordUsageResult;
  }

  yield* trackAppVarietyFromInput(input, todayUtc);
  const { prevTotal, newTotal } = yield* bumpTotalWords(input.wordCount);
  const readout = yield* readRecordUsageSnapshot(localDate, todayUtc);

  const unlockSnap: UnlockSnapshot = {
    ...readout,
    entry: {
      wordCount: input.wordCount,
      inputWordCount,
      durationMs: input.durationMs,
      language: input.language,
      createdAt: input.createdAt,
    },
  };
  const unlocked = yield* awardAchievements(unlockSnap, input.createdAt);
  yield* maybeUpdateMaxStreak(readout.currentStreak);
  const unlockedMilestones = yield* awardMilestones(prevTotal, newTotal, input.createdAt);

  const stats = computeRecordUsageStats(input, inputWordCount, readout, todayUtc);

  const result: RecordUsageResult = {
    unlockedAchievements: unlocked,
    unlockedMilestones,
    stats,
  };
  return result;
});

export interface UsageInsights {
  readonly totals: { wordCount: number; durationMs: number; entryCount: number };
  readonly apps: ReadonlyArray<AppUsageAggregateRow>;
  readonly platforms: ReadonlyArray<DimensionAggregateRow>;
  readonly languages: ReadonlyArray<DimensionAggregateRow>;
  readonly hours: ReadonlyArray<HourAggregateRow>;
}

export const getUsageInsights = Effect.fnUntraced(function* (range: InsightsRange) {
  const stats = yield* StatsReader;
  const [totals, apps, platforms, languages, hours] = yield* Effect.all(
    [
      stats.rangeTotals(range),
      stats.appUsageAggregate(range),
      stats.platformAggregate(range),
      stats.languageAggregate(range),
      stats.hourAggregate(range),
    ],
    { concurrency: "unbounded" }
  );
  return { totals, apps, platforms, languages, hours } satisfies UsageInsights;
});

export interface ShareCardStats {
  readonly totalWords: number;
  readonly totalDuration: number;
  readonly totalTranscriptions: number;
  readonly weeklyAvgWpm: number;
  readonly currentStreak: number;
  readonly maxStreak: number;
  readonly memberSince: number | null;
  readonly personalBestWpm: number;
  readonly distinctSkillsAllTime: number;
  readonly distinctLanguagesAllTime: number;
}

export const getShareCardStats = Effect.gen(function* () {
  const snapshot = yield* SnapshotReader;
  const stats = yield* StatsReader;
  const summary = yield* SummaryStore;
  const [
    rows,
    recentDays,
    totalTranscriptions,
    totalDuration,
    memberSince,
    personalBestWpm,
    distinctSkillsAllTime,
    distinctLanguagesAllTime,
    summaryRow,
  ] = yield* Effect.all(
    [
      snapshot.aggregateLocalDays(LOCAL_DAYS_LOOKBACK),
      snapshot.recentActiveDaysDescUtc(STREAK_DAYS_LOOKBACK),
      snapshot.countSuccess(),
      stats.sumAllDuration(),
      stats.minCreatedAt(),
      stats.maxSpeakingWpm(),
      snapshot.distinctSkillsAllTime(),
      snapshot.distinctPrimaryLanguagesAllTime(),
      summary.get(),
    ],
    { concurrency: "unbounded" }
  );
  const todayUtc = utcDateString(Date.now());
  const core = computeCoreStats(rows, recentDays, todayUtc);

  return {
    totalWords: core.totalWords,
    totalDuration,
    totalTranscriptions,
    weeklyAvgWpm: core.weeklyAvgWpm,
    currentStreak: core.currentStreak,
    maxStreak: Math.max(summaryRow.maxStreak, core.currentStreak),
    memberSince,
    personalBestWpm,
    distinctSkillsAllTime,
    distinctLanguagesAllTime,
  } satisfies ShareCardStats;
});
