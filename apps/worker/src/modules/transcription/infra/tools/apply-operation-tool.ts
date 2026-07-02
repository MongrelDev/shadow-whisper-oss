import { Effect } from "effect";
import { jsonSchema, tool } from "ai";
import type { InstalledSkillSummary } from "../../../skills-catalog/domain/installed-skill";
import type { SkillRepositoryService } from "../../../skills/application/ports/skill-repository";
import type { TranscriptOperation } from "../../domain/operations";
import { resolveSelection, type ResolvedSelection } from "./resolve-selection";

export interface ApplyOperationToolDeps {
  readonly operations: readonly TranscriptOperation[];
  readonly installedSkills: readonly InstalledSkillSummary[];
  readonly skillLoader: SkillRepositoryService;
}

export interface ApplyOperationToolInput {
  readonly id: string;
}

export const APPLY_OPERATION_TOOL_NAME = "applyOperation";

export const makeApplyOperationTool = (deps: ApplyOperationToolDeps) =>
  tool({
    description:
      "Apply a transcript operation or a voice-activated user skill by its id. Call this only when the speaker's intent clearly calls for an operation, or when they explicitly request a skill. The returned skillMarkdown contains instructions that REPLACE the default cleanup task — follow them as your new guidelines for processing the transcript.",
    inputSchema: jsonSchema<ApplyOperationToolInput>({
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The exact id of the operation or installed skill to apply.",
        },
      },
      required: ["id"],
      additionalProperties: false,
    }),
    execute: ({ id }): Promise<ResolvedSelection> =>
      Effect.runPromise(
        resolveSelection(id, {
          operations: deps.operations,
          installed: deps.installedSkills,
          skillLoader: deps.skillLoader,
        })
      ),
  });
