export const SKILL_BUILDER_STEPS = ["describe", "review", "done"] as const;

export type SkillBuilderStepId = (typeof SKILL_BUILDER_STEPS)[number];

export function isSkillBuilderStep(value: unknown): value is SkillBuilderStepId {
  return typeof value === "string" && (SKILL_BUILDER_STEPS as readonly string[]).includes(value);
}
