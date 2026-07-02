export interface CustomSkill {
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
  readonly description: string;
  readonly markdown: string;
  readonly triggers: readonly string[];
  readonly createdAt: number;
  readonly updatedAt: number;
}
