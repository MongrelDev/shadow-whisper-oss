import { Effect } from "effect";
import { ChatError, type ChatService, type GatewayMetadata } from "./ai";
import { gatewayMetadataHeaders, makeGroqClient } from "./groq-client";
import { unknownMessage } from "../../../lib/unknown-message";

const GROQ_CHAT_MODEL = "llama-3.3-70b-versatile";

interface GroqChatClientOptions {
  readonly chatMaxCompletionTokens: number;
  readonly transformMaxCompletionTokens: number;
}

export const makeGroqChatClient = (env: Env, options: GroqChatClientOptions): ChatService => {
  const client = makeGroqClient(env);

  const run = (
    system: string,
    message: string,
    maxTokens: number,
    gatewayMetadata?: GatewayMetadata
  ) =>
    Effect.tryPromise({
      try: async () => {
        const completion = await client.chat.completions.create(
          {
            model: GROQ_CHAT_MODEL,
            messages: [
              { role: "system", content: system },
              { role: "user", content: message },
            ],
            temperature: 0,
            max_tokens: maxTokens,
          },
          { headers: gatewayMetadataHeaders(GROQ_CHAT_MODEL, gatewayMetadata) }
        );
        return (completion.choices[0]?.message?.content ?? "").trim();
      },
      catch: (e) => new ChatError({ message: `[${GROQ_CHAT_MODEL}] ${unknownMessage(e)}` }),
    });

  return {
    chat: ({ system, message, gatewayMetadata }) =>
      run(system, message, options.chatMaxCompletionTokens, gatewayMetadata),
    transformText: ({ system, message, gatewayMetadata }) =>
      run(system, message, options.transformMaxCompletionTokens, gatewayMetadata),
  };
};
