import { Schema } from "effect";
import { AchievementKey, MilestoneKey } from "@whisper/api";

const DateString = Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/));

export const DailyBreakdownQuery = Schema.Struct({
  from: DateString,
  to: DateString,
});
export type DailyBreakdownQuery = typeof DailyBreakdownQuery.Type;

export const UsageInsightsQuery = Schema.Struct({
  from: Schema.optional(DateString),
  to: Schema.optional(DateString),
});
export type UsageInsightsQuery = typeof UsageInsightsQuery.Type;

export const InsightCategoryItem = Schema.Struct({
  category: Schema.String,
  wordCount: Schema.Number,
  entryCount: Schema.Number,
  pctWords: Schema.Number,
});
export type InsightCategoryItem = typeof InsightCategoryItem.Type;

export const InsightAppItem = Schema.Struct({
  hostName: Schema.String,
  category: Schema.String,
  wordCount: Schema.Number,
  entryCount: Schema.Number,
  pctWords: Schema.Number,
});
export type InsightAppItem = typeof InsightAppItem.Type;

export const InsightDimensionItem = Schema.Struct({
  key: Schema.String,
  wordCount: Schema.Number,
  entryCount: Schema.Number,
});
export type InsightDimensionItem = typeof InsightDimensionItem.Type;

export const InsightHourItem = Schema.Struct({
  hour: Schema.Number,
  wordCount: Schema.Number,
  entryCount: Schema.Number,
});
export type InsightHourItem = typeof InsightHourItem.Type;

export const UsageInsightsResponse = Schema.Struct({
  from: Schema.NullOr(DateString),
  to: Schema.NullOr(DateString),
  totals: Schema.Struct({
    wordCount: Schema.Number,
    durationMs: Schema.Number,
    entryCount: Schema.Number,
    distinctApps: Schema.Number,
  }),
  categories: Schema.Array(InsightCategoryItem),
  topApps: Schema.Array(InsightAppItem),
  platforms: Schema.Array(InsightDimensionItem),
  languages: Schema.Array(InsightDimensionItem),
  hours: Schema.Array(InsightHourItem),
});
export type UsageInsightsResponse = typeof UsageInsightsResponse.Type;

export const DailyBreakdownItem = Schema.Struct({
  localDate: DateString,
  platform: Schema.String,
  os: Schema.String,
  hostName: Schema.String,
  category: Schema.String,
  wordCount: Schema.Number,
  durationMs: Schema.Number,
  entryCount: Schema.Number,
});
export type DailyBreakdownItem = typeof DailyBreakdownItem.Type;

export const DailyBreakdownResponse = Schema.Struct({
  from: DateString,
  to: DateString,
  items: Schema.Array(DailyBreakdownItem),
  achievementDates: Schema.Array(DateString),
});
export type DailyBreakdownResponse = typeof DailyBreakdownResponse.Type;

export const AchievementProgress = Schema.Struct({
  current: Schema.Number,
  target: Schema.Number,
  label: Schema.String,
});
export type AchievementProgress = typeof AchievementProgress.Type;

export const AchievementItem = Schema.Struct({
  key: AchievementKey,
  earnedAt: Schema.NullOr(Schema.Number),
  contextJson: Schema.NullOr(Schema.String),
  progress: Schema.optional(AchievementProgress),
});
export type AchievementItem = typeof AchievementItem.Type;

export const AchievementsResponse = Schema.Struct({
  items: Schema.Array(AchievementItem),
});
export type AchievementsResponse = typeof AchievementsResponse.Type;

export const MilestoneItem = Schema.Struct({
  key: MilestoneKey,
  earnedAt: Schema.NullOr(Schema.Number),
  contextJson: Schema.NullOr(Schema.String),
});
export type MilestoneItem = typeof MilestoneItem.Type;

export const UserStatsResponse = Schema.Struct({
  currentStreak: Schema.Number,
  weeklyAvgWpm: Schema.Number,
  totalWords: Schema.Number,
  isFirstWeek: Schema.Boolean,
  hasAnyEntries: Schema.Boolean,
  achievements: Schema.Array(AchievementItem),
  milestones: Schema.Array(MilestoneItem),
});
export type UserStatsResponse = typeof UserStatsResponse.Type;

export const ShareCardStatsResponse = Schema.Struct({
  totalWords: Schema.Number,
  totalDuration: Schema.Number,
  totalTranscriptions: Schema.Number,
  weeklyAvgWpm: Schema.Number,
  currentStreak: Schema.Number,
  maxStreak: Schema.Number,
  memberSince: Schema.NullOr(Schema.Number),
  personalBestWpm: Schema.Number,
  distinctSkillsAllTime: Schema.Number,
  distinctLanguagesAllTime: Schema.Number,
  achievements: Schema.Array(AchievementItem),
  milestones: Schema.Array(MilestoneItem),
});
export type ShareCardStatsResponse = typeof ShareCardStatsResponse.Type;
