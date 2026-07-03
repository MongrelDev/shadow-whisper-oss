import { Effect } from "effect";
import { generateText } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { ChatError, type ChatService, type GatewayMetadata } from "./ai";
import { unknownMessage } from "../../../lib/unknown-message";

export type LlamaModel =
  | "@cf/meta/llama-3.2-1b-instruct"
  | "@cf/meta/llama-3.2-3b-instruct"
  | "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

type LlamaClientOptions = {
  model: LlamaModel;
  chatMaxCompletionTokens: number;
  transformMaxCompletionTokens: number;
  sessionAffinity: string;
};

export const makeLlamaClient = (env: Env, options: LlamaClientOptions): ChatService => {
  const provider = createWorkersAI({ binding: env.AI });

  const buildModel = (gatewayMetadata?: GatewayMetadata) =>
    provider(options.model, {
      sessionAffinity: options.sessionAffinity,
      gateway: {
        id: env.AI_GATEWAY_ID,
        ...(gatewayMetadata ? { metadata: { ...gatewayMetadata, model: options.model } } : {}),
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
