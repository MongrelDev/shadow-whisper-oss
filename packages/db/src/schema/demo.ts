import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const demoTranscripts = sqliteTable(
  "demo_transcripts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workflowId: text("workflow_id").notNull().unique(),
    kind: text("kind", { enum: ["transcribe", "skill"] }).notNull(),
    phase: text("phase", {
      enum: [
        "queued",
        "transcribing",
        "transcribed",
        "cleaning",
        "applying",
        "complete",
        "error",
        "cancelled",
      ],
    })
      .notNull()
      .default("queued"),
    surfaceId: text("surface_id"),
    skillId: text("skill_id"),
    rawText: text("raw_text"),
    cleanText: text("clean_text"),
    durationMs: integer("duration_ms"),
    audioBytes: integer("audio_bytes"),
    wordCount: integer("word_count"),
    locale: text("locale"),
    ipHash: text("ip_hash").notNull(),
    errorMessage: text("error_message"),
    cancelledAt: integer("cancelled_at"),
    phaseUpdatedAt: integer("phase_updated_at")
      .notNull()
      .default(sql`(strftime('%s','now') * 1000)`),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(strftime('%s','now') * 1000)`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(strftime('%s','now') * 1000)`),
  },
  (table) => [
    index("idx_demo_transcripts_created_at").on(table.createdAt),
    index("idx_demo_transcripts_ip_hash").on(table.ipHash),
  ]
);
