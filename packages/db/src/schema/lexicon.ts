import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const learnedWords = sqliteTable(
  "learned_words",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    replacement: text("replacement").notNull(),
    sourceLower: text("source_lower").notNull(),
    context: text("context"),
    frequency: integer("frequency").notNull().default(1),
    lastUsedAt: integer("last_used_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("learned_words_user_source_lower_idx").on(t.userId, t.sourceLower)]
);

export const dictionaryWords = sqliteTable(
  "dictionary_words",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    word: text("word").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("dictionary_words_user_idx").on(t.userId)]
);

export const dictionarySnippets = sqliteTable(
  "dictionary_snippets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    triggerPhrase: text("trigger_phrase").notNull(),
    expandedText: text("expanded_text").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("dictionary_snippets_user_idx").on(t.userId)]
);

export const installedSkills = sqliteTable(
  "installed_skills",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    skillId: text("skill_id").notNull(),
    displayName: text("display_name").notNull(),
    description: text("description").notNull(),
    slug: text("slug").notNull(),
    installedAt: integer("installed_at").notNull(),
  },
  (t) => [uniqueIndex("installed_skills_user_skill_idx").on(t.userId, t.skillId)]
);

export const customSkills = sqliteTable(
  "custom_skills",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    description: text("description").notNull().default(""),
    markdown: text("markdown").notNull(),
    triggers: text("triggers").notNull().default("[]"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("custom_skills_user_idx").on(t.userId)]
);

export const pendingSuggestions = sqliteTable(
  "pending_suggestions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    feedbackId: text("feedback_id").notNull(),
    original: text("original").notNull(),
    replacement: text("replacement").notNull(),
    context: text("context").notNull().default(""),
    selectedText: text("selected_text").notNull().default(""),
    status: text("status").notNull().default("pending"),
    source: text("source").notNull().default("teach"),
    matchedSessionId: text("matched_session_id"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("pending_suggestions_user_status_idx").on(t.userId, t.status)]
);
