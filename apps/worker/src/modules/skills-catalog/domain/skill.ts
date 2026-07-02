export type SkillSource = "official" | "custom";

export interface Skill {
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
  readonly description: string | null;
  readonly triggers: readonly string[];
  readonly markdown: string | null;
  readonly source: SkillSource;
  readonly isInstalled: boolean;
  readonly createdAt: number | null;
  readonly updatedAt: number | null;
}
