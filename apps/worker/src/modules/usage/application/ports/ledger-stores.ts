import { Context, type Effect } from "effect";
import type { AchievementKey, MilestoneKey } from "../../domain/usage-analytics";
import type { UsageLedgerStorageError } from "../../errors";

export interface UsageEntryRow {
  readonly id: string;
  readonly wordCount: number;
  readonly inputWordCount: number | null;
  readonly bundleId: string | null;
  readonly siteHost: string | null;
  readonly surfaceContext: string | null;
  readonly enginesJson: string | null;
  readonly durationMs: number;
  readonly createdAt: number;
  readonly platform: "desktop" | "extension";
  readonly os: string;
  readonly language: string | null;
  readonly localDate: string;
  readonly localHour: number;
  readonly timezone: string;
}

export interface SkillUsageRow {
  readonly skillId: string;
  readonly skillVersion: number;
  readonly inputWordCount: number;
  readonly outputWordCount: number;
  readonly durationMs: number;
  readonly success: number;
  readonly bundleId: string | null;
  readonly siteHost: string | null;
  readonly surfaceContext: string;
  readonly platform: "desktop" | "extension";
  readonly os: string;
  readonly language: string | null;
  readonly localDate: string;
  readonly localHour: number;
  readonly timezone: string;
  readonly createdAt: number;
}

export interface LanguageWordTotalRow {
  readonly language: string;
  readonly words: number;
}

export interface LocalDayAggregate {
  readonly day: string;
  readonly words: number;
  readonly durationMs: number;
}

export interface DailyBreakdownRow {
  readonly localDate: string;
  readonly platform: string;
  readonly os: string;
  readonly bundleId: string | null;
  readonly siteHost: string | null;
  readonly wordCount: number;
  readonly durationMs: number;
  readonly entryCount: number;
}

export interface InsightsRange {
  readonly fromLocalDate: string | null;
  readonly toLocalDate: string | null;
}

export interface AppUsageAggregateRow {
  readonly bundleId: string | null;
  readonly siteHost: string | null;
  readonly wordCount: number;
  readonly durationMs: number;
  readonly entryCount: number;
}

export interface DimensionAggregateRow {
  readonly key: string;
  readonly wordCount: number;
  readonly entryCount: number;
}

export interface HourAggregateRow {
  readonly hour: number;
  readonly wordCount: number;
  readonly entryCount: number;
}

type E<A> = Effect.Effect<A, UsageLedgerStorageError>;

export interface EntryWriterService {
  readonly insert: (row: UsageEntryRow) => E<boolean>;
  readonly appendSkillUsage: (row: SkillUsageRow) => E<void>;
}

export class EntryWriter extends Context.Service<EntryWriter, EntryWriterService>()(
  "EntryWriter"
) {}

export interface SnapshotReaderService {
  readonly countSuccess: () => E<number>;
  readonly sumAllWords: () => E<number>;
  readonly sumTodayWordCountUtc: (todayUtc: string) => E<number>;
  readonly sumTodayWordCountLocal: (todayLocal: string) => E<number>;
  readonly aggregateLocalDays: (limit: number) => E<ReadonlyArray<LocalDayAggregate>>;
  readonly recentActiveDaysDescUtc: (limit: number) => E<ReadonlyArray<string>>;
  readonly distinctActiveDays: () => E<number>;
  readonly maxWordCountAllTime: () => E<number>;
  readonly languageWordTotalsAllTime: () => E<ReadonlyArray<LanguageWordTotalRow>>;
  readonly distinctPrimaryLanguagesAllTime: () => E<number>;
  readonly distinctSkillsAllTime: () => E<number>;
  readonly distinctPlatformsToday: (todayUtc: string) => E<number>;
}

export class SnapshotReader extends Context.Service<SnapshotReader, SnapshotReaderService>()(
  "SnapshotReader"
) {}

export interface StatsReaderService {
  readonly aggregateLocalDays: (limit: number) => E<ReadonlyArray<LocalDayAggregate>>;
  readonly recentActiveDaysDescUtc: (limit: number) => E<ReadonlyArray<string>>;
  readonly dailyBreakdown: (
    fromLocalDate: string,
    toLocalDate: string
  ) => E<ReadonlyArray<DailyBreakdownRow>>;
  readonly weeklyWordCount: (weekStartMs: number, weekEndMs: number) => E<number>;
  readonly sumAllDuration: () => E<number>;
  readonly minCreatedAt: () => E<number | null>;
  readonly maxSpeakingWpm: () => E<number>;
  readonly countSuccess: () => E<number>;
  readonly distinctPrimaryLanguagesAllTime: () => E<number>;
  readonly distinctSkillsAllTime: () => E<number>;
  readonly appUsageAggregate: (range: InsightsRange) => E<ReadonlyArray<AppUsageAggregateRow>>;
  readonly platformAggregate: (range: InsightsRange) => E<ReadonlyArray<DimensionAggregateRow>>;
  readonly languageAggregate: (range: InsightsRange) => E<ReadonlyArray<DimensionAggregateRow>>;
  readonly hourAggregate: (range: InsightsRange) => E<ReadonlyArray<HourAggregateRow>>;
  readonly rangeTotals: (
    range: InsightsRange
  ) => E<{ wordCount: number; durationMs: number; entryCount: number }>;
}

export class StatsReader extends Context.Service<StatsReader, StatsReaderService>()(
  "StatsReader"
) {}

export interface BadgeRecord {
  readonly earnedAt: number;
  readonly contextJson: string | null;
}

export interface BadgeStoreService {
  readonly tryAward: (
    key: AchievementKey | MilestoneKey,
    earnedAt: number,
    contextJson: string | null
  ) => E<boolean>;
  readonly listEarnedAchievements: () => E<ReadonlyMap<AchievementKey, BadgeRecord>>;
  readonly listEarnedMilestones: () => E<ReadonlyMap<MilestoneKey, BadgeRecord>>;
}

export class BadgeStore extends Context.Service<BadgeStore, BadgeStoreService>()("BadgeStore") {}

export interface AppVarietyStoreService {
  readonly track: (todayUtc: string, identifier: string) => E<void>;
  readonly countDistinctToday: (todayUtc: string) => E<number>;
}

export class AppVarietyStore extends Context.Service<AppVarietyStore, AppVarietyStoreService>()(
  "AppVarietyStore"
) {}

export interface UserSummaryRow {
  readonly totalWords: number;
  readonly allTimeDailyBest: number;
  readonly maxStreak: number;
}

export interface SummaryStoreService {
  readonly get: () => E<UserSummaryRow>;
  readonly incrementTotalWords: (added: number) => E<{ prevTotal: number; newTotal: number }>;
  readonly raiseMaxStreak: (streak: number) => E<void>;
}

export class SummaryStore extends Context.Service<SummaryStore, SummaryStoreService>()(
  "SummaryStore"
) {}
