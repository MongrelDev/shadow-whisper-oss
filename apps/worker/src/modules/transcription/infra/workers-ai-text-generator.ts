import { Effect } from "effect";
import { generateText, stepCountIs } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { unknownMessage } from "../../../lib/unknown-message";
import { REQUEST_TIMEOUT_MS, withRequestTimeout } from "../../../lib/request-timeout";
import { PRIMARY_MODEL } from "../../../platform/cloudflare/workers-ai/models";
import type { SkillRepositoryService } from "../../skills/application/ports/skill-repository";
import { TextImproverError } from "../application/ports/text-improver";
import type { TextGeneratorService } from "../application/ports/text-generator";
import { APPLY_OPERATION_TOOL_NAME, makeApplyOperationTool } from "./tools/apply-operation-tool";

const MAX_OUTPUT_TOKENS = 2048;

export const makeWorkersAiTextGenerator = (
  env: Env,
  skillLoader: SkillRepositoryService
): TextGeneratorService => ({
  generate: (req) =>
    Effect.tryPromise({
      try: async () => {
        const provider = createWorkersAI({ binding: env.AI });
        const tools = req.routing
          ? {
              [APPLY_OPERATION_TOOL_NAME]: makeApplyOperationTool({
                operations: req.routing.operations,
                installedSkills: req.routing.installed,
                skillLoader,
              }),
            }
          : undefined;

        return generateText({
          model: provider(PRIMARY_MODEL, {
            sessionAffinity: `ses_${req.userId}`,
            chat_template_kwargs: { enable_thinking: false },
          }),
          system: req.system,
          prompt: req.prompt,
          ...(tools ? { tools, stopWhen: stepCountIs(2) } : {}),
          temperature: 0,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        });
      },
      catch: (e) => new TextImproverError({ message: `[${PRIMARY_MODEL}] ${unknownMessage(e)}` }),
    }).pipe(
      // finish_reason "length" means Gemma hit the token cap and the cleaned
      // transcript is cut mid-sentence — surface it instead of returning silently.
      Effect.tap((result) =>
        result.finishReason === "length"
          ? Effect.logWarning("Text improvement truncated at token cap", {
              model: PRIMARY_MODEL,
              maxOutputTokens: MAX_OUTPUT_TOKENS,
            })
          : Effect.void
      ),
      Effect.map((result) => result.text.trim()),
      withRequestTimeout(
        () =>
          new TextImproverError({
            message: `[${PRIMARY_MODEL}] request timed out after ${REQUEST_TIMEOUT_MS}ms`,
            retryable: true,
          })
      )
    ),
});
