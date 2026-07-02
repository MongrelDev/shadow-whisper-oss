import { Effect } from "effect";
import { generateText } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { ChatError, type ChatService } from "./ai";
import { unknownMessage } from "../../../lib/unknown-message";

export type LlamaModel = "@cf/meta/llama-3.2-1b-instruct" | "@cf/meta/llama-3.2-3b-instruct";

type LlamaClientOptions = {
  model: LlamaModel;
  chatMaxCompletionTokens: number;
  transformMaxCompletionTokens: number;
  sessionAffinity: string;
};

export const makeLlamaClient = (env: Env, options: LlamaClientOptions): ChatService => {
  const provider = createWorkersAI({ binding: env.AI });
  const model = provider(options.model, {
    sessionAffinity: options.sessionAffinity,
  });

  const run = (system: string, message: string, maxOutputTokens: number) =>
    Effect.tryPromise({
      try: async () => {
        const result = await generateText({
          model,
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
    chat: ({ system, message }) => run(system, message, options.chatMaxCompletionTokens),
    transformText: ({ system, message }) =>
      run(system, message, options.transformMaxCompletionTokens),
  };
};
