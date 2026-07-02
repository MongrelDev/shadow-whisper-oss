import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const usageEntries = sqliteTable(
  "usage_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    wordCount: integer("word_count").notNull(),
    bundleId: text("bundle_id"),
    siteHost: text("site_host"),
    surfaceContext: text("surface_context"),
    enginesJson: text("engines_json"),
    durationMs: integer("duration_ms").notNull(),
    createdAt: integer("created_at").notNull(),
    skillId: text("skill_id"),
    skillVersion: integer("skill_version"),
    inputWordCount: integer("input_word_count"),
    outputWordCount: integer("output_word_count"),
    success: integer("success").notNull().default(1),
    platform: text("platform", { enum: ["desktop", "extension"] }).notNull(),
    os: text("os").notNull(),
    language: text("language"),
    localDate: text("local_date").notNull(),
    localHour: integer("local_hour").notNull(),
    timezone: text("timezone").notNull(),
  },
  (t) => [
    index("usage_entries_user_created_at_idx").on(t.userId, t.createdAt),
    index("usage_entries_user_local_date_idx").on(t.userId, t.localDate),
  ]
);

export const userAchievements = sqliteTable(
  "user_achievements",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    achievementKey: text("achievement_key").notNull(),
    earnedAt: integer("earned_at").notNull(),
    contextJson: text("context_json"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.achievementKey] })]
);

export const userSummary = sqliteTable("user_summary", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  totalWords: integer("total_words").notNull().default(0),
  allTimeDailyBest: integer("all_time_daily_best").notNull().default(0),
  maxStreak: integer("max_streak").notNull().default(0),
});

export const appVarietyToday = sqliteTable(
  "app_variety_today",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    localDate: text("local_date").notNull(),
    identifier: text("identifier").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.localDate, t.identifier] })]
);
