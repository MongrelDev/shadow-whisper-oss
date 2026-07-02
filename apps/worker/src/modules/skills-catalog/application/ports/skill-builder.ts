import { Context, Effect } from "effect";
import type { SkillExecutionError } from "../../errors";

export interface BuildSkillInput {
  readonly description: string;
}

export interface BuildSkillResult {
  readonly markdown: string;
  readonly displayName: string;
  readonly description: string;
  readonly slug: string;
  readonly triggers: readonly string[];
}

export interface SkillBuilderShape {
  readonly build: (input: BuildSkillInput) => Effect.Effect<BuildSkillResult, SkillExecutionError>;
}

export class SkillBuilder extends Context.Service<SkillBuilder, SkillBuilderShape>()(
  "SkillBuilder"
) {}
