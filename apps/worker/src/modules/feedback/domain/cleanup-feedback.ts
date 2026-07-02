export interface CleanupFeedbackEntry {
  readonly userId: string;
  readonly rating: "like" | "dislike";
  readonly rawText: string;
  readonly formattedText: string;
  readonly language: string;
  readonly wordCount: number;
  readonly diffRatio: number;
  readonly transcriptionCreatedAt: string;
  readonly platform: "desktop" | "extension";
  readonly os: string;
  readonly bundleId: string | null;
  readonly host: string | null;
  readonly appCategory: string | null;
  readonly installedSkillCount: number | null;
}
