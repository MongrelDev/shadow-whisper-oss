import { Effect } from "effect";
import { SkillRepository } from "../../modules/skills/application/ports/skill-repository";
import { SkillExecutor } from "../../modules/skills-catalog/application/ports/skill-executor";

export type ProcessDemoSkillResult =
  | { ok: true; cleanText: string }
  | { ok: false; reason: "empty_input" };

export interface DemoSkillInput {
  readonly rawText: string;
  readonly skillKeys: readonly string[];
  readonly gatewayMetadata?: Readonly<Record<string, string>>;
}

export const runDemoSkill = Effect.fnUntraced(function* (input: DemoSkillInput) {
  const trimmed = input.rawText.trim();
  if (!trimmed) return { ok: false as const, reason: "empty_input" as const };

  const loader = yield* SkillRepository;
  const executor = yield* SkillExecutor;

  const skillBody = yield* loader
    .compose(input.skillKeys)
    .pipe(Effect.withSpan("do.skill-compose"));

  const cleanText = yield* executor
    .execute({
      skillMarkdown: skillBody,
      inputText: trimmed,
      ...(input.gatewayMetadata ? { gatewayMetadata: input.gatewayMetadata } : {}),
    })
    .pipe(
      Effect.withSpan("do.skill-execute", {
        attributes: {
          "skill.keys": input.skillKeys.join(","),
          "input.length": trimmed.length,
        },
      })
    );

  return { ok: true as const, cleanText };
});
