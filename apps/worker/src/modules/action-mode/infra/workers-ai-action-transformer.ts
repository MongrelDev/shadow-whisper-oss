import { Effect } from "effect";
import { makeLlamaClient } from "../../../platform/cloudflare/workers-ai/ai-llama";
import { ACTION_MODE_SYSTEM, buildActionUserMessage } from "../domain/action-prompt";
import { ActionTransformError } from "../errors";
import type { ActionTextTransformerService } from "../application/ports/action-text-transformer";

export const ACTION_MODE_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast" as const;

// 24k-token context on this model; the selected text is capped at 50k chars
// (~13-16k tokens), so 4096 output tokens still fit with headroom.
const TRANSFORM_MAX_COMPLETION_TOKENS = 4096;

export const makeWorkersAiActionTransformer = (env: Env): ActionTextTransformerService => {
  const client = makeLlamaClient(env, {
    model: ACTION_MODE_MODEL,
    chatMaxCompletionTokens: TRANSFORM_MAX_COMPLETION_TOKENS,
    transformMaxCompletionTokens: TRANSFORM_MAX_COMPLETION_TOKENS,
    sessionAffinity: "action-mode",
  });

  return {
    transform: ({ instruction, selectedText, gatewayMetadata }) =>
      client
        .transformText({
          system: ACTION_MODE_SYSTEM,
          message: buildActionUserMessage(instruction, selectedText),
          gatewayMetadata,
        })
        .pipe(
          Effect.map((text) => ({ text, engine: ACTION_MODE_MODEL })),
          Effect.mapError((e) => new ActionTransformError({ message: e.message }))
        ),
  };
};
