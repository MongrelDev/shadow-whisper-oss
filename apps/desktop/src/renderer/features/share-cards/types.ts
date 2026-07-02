import type { AchievementItem, MilestoneItem } from "@whisper/api";

export interface ShareCardData {
  readonly userName: string;
  readonly plan: string;
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
  readonly achievements: ReadonlyArray<AchievementItem>;
  readonly milestones: ReadonlyArray<MilestoneItem>;
}
