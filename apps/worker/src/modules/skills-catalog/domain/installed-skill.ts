export interface InstalledSkillSummary {
  readonly skillId: string;
  readonly displayName: string;
  readonly description: string;
  readonly slug: string;
  readonly installedAt: number;
  readonly markdown?: string;
  readonly triggers?: readonly string[];
}
