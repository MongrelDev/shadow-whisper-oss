import { Data } from "effect";

export interface OfficialSkillDefinition {
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
  readonly description: string;
  readonly triggers: readonly string[];
  readonly surface: "transformer";
  readonly demo: boolean;
  readonly markdown: string;
}

export class SkillLoaderError extends Data.TaggedError("SkillLoaderError")<{
  readonly message: string;
  readonly key?: string;
}> {}

export class SkillParseError extends Data.TaggedError("SkillParseError")<{
  readonly message: string;
  readonly internal: { readonly skillId: string; readonly field?: string };
}> {}
