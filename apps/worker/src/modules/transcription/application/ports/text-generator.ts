import { Context, Effect } from "effect";
import type { InstalledSkillSummary } from "../../../skills-catalog/domain/installed-skill";
import type { TranscriptOperation } from "../../domain/operations";
import { TextImproverError } from "./text-improver";

// The intent-router catalog the generator offers as a tool: system operations the
// model may apply on inferred intent, plus user skills it may apply on explicit
// request. Absent in forced-skill mode (no routing — the skill is mandatory).
export interface RoutingCatalog {
  readonly operations: readonly TranscriptOperation[];
  readonly installed: InstalledSkillSummary[];
}

export interface GenerateTextRequest {
  readonly userId: string;
  readonly system: string;
  readonly prompt: string;
  readonly routing?: RoutingCatalog;
}

export interface TextGeneratorService {
  readonly generate: (req: GenerateTextRequest) => Effect.Effect<string, TextImproverError>;
}

export class TextGenerator extends Context.Service<TextGenerator, TextGeneratorService>()(
  "TextGenerator"
) {}
