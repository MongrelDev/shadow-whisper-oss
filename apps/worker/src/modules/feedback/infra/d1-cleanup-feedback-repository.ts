import { Effect } from "effect";
import type { CleanupFeedbackRepositoryService } from "../application/ports/cleanup-feedback-repository";
import { FeedbackPersistError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";

export const makeD1CleanupFeedbackRepository = (env: Env): CleanupFeedbackRepositoryService => ({
  record: (entry) =>
    Effect.tryPromise({
      try: () =>
        env.DB.prepare(
          `INSERT INTO cleanup_feedback
             (id, user_id, rating, raw_text, formatted_text, language, word_count,
              diff_ratio, transcription_created_at, platform, os, bundle_id, host,
              app_category, installed_skill_count, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            crypto.randomUUID(),
            entry.userId,
            entry.rating,
            entry.rawText,
            entry.formattedText,
            entry.language,
            entry.wordCount,
            entry.diffRatio,
            entry.transcriptionCreatedAt,
            entry.platform,
            entry.os,
            entry.bundleId,
            entry.host,
            entry.appCategory,
            entry.installedSkillCount,
            new Date().toISOString()
          )
          .run(),
      catch: (e) => new FeedbackPersistError({ message: unknownMessage(e) }),
    }).pipe(Effect.asVoid),
});
