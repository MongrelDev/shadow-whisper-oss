import { Effect } from "effect";
import { generateText } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { ChatError, type ChatService, type GatewayMetadata } from "./ai";
import { unknownMessage } from "../../../lib/unknown-message";

const GEMMA_MODEL = "@cf/google/gemma-4-26b-a4b-it";

type GemmaClientOptions = {
  chatMaxCompletionTokens: number;
  transformMaxCompletionTokens: number;
  sessionAffinity: string;
};

export const makeGemmaClient = (env: Env, options: GemmaClientOptions): ChatService => {
  const provider = createWorkersAI({ binding: env.AI });

  const buildModel = (gatewayMetadata?: GatewayMetadata) =>
    provider(GEMMA_MODEL, {
      sessionAffinity: options.sessionAffinity,
      chat_template_kwargs: { enable_thinking: false, clear_thinking: true },
      gateway: {
        id: env.AI_GATEWAY_ID,
        ...(gatewayMetadata ? { metadata: { ...gatewayMetadata, model: GEMMA_MODEL } } : {}),
      },
    });

  const run = (
    system: string,
    message: string,
    maxOutputTokens: number,
    gatewayMetadata?: GatewayMetadata
  ) =>
    Effect.tryPromise({
      try: async () => {
        const result = await generateText({
          model: buildModel(gatewayMetadata),
          system,
          prompt: message,
          temperature: 0,
          maxOutputTokens,
        });
        return result.text.trim();
      },
      catch: (e) => new ChatError({ message: unknownMessage(e) }),
    });

  return {
    chat: ({ system, message, gatewayMetadata }) =>
      run(system, message, options.chatMaxCompletionTokens, gatewayMetadata),
    transformText: ({ system, message, gatewayMetadata }) =>
      run(system, message, options.transformMaxCompletionTokens, gatewayMetadata),
  };
};
