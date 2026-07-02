import { Context, Effect } from "effect";
import { SkillExecutionError } from "../../errors";

export interface SkillExecutorService {
  readonly execute: (params: {
    readonly skillMarkdown: string;
    readonly inputText: string;
    readonly gatewayMetadata?: Readonly<Record<string, string>>;
  }) => Effect.Effect<string, SkillExecutionError>;
}

export class SkillExecutor extends Context.Service<SkillExecutor, SkillExecutorService>()(
  "SkillExecutor"
) {}
