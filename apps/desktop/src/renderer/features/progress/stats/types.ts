import type { AchievementItem, MilestoneItem } from "@whisper/api";

export interface UserStatsView {
  currentStreak: number;
  weeklyAvgWpm: number;
  totalWords: number;
  isFirstWeek: boolean;
  hasAnyEntries: boolean;
  achievements: ReadonlyArray<AchievementItem>;
  milestones: ReadonlyArray<MilestoneItem>;
}
