import type { AchievementKey, MilestoneKey } from "@whisper/api";
import type { RecordUsageStats } from "../../usage/domain/usage-analytics";

/**
 * Gamification/usage data computed asynchronously after a transcription
 * completes. Delivered to clients over the session events stream
 * (`GET /api/sessions/:sessionId/events`), never on the transcribe response.
 */
export interface RecordCompletionResult {
  readonly unlockedAchievements: ReadonlyArray<AchievementKey>;
  readonly unlockedMilestones: ReadonlyArray<MilestoneKey>;
  readonly stats: RecordUsageStats;
}
