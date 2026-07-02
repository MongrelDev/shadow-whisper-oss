import { Effect } from "effect";
import { TranscribeError, type TranscribeService } from "./ai";
import { arrayBufferToDataUri } from "./array-buffer-to-data-uri";
import { unknownMessage } from "../../../lib/unknown-message";

const GPT4O_TRANSCRIBE_MODEL = "openai/gpt-4o-transcribe";

function buildPrompt(
  dictionaryHints?: ReadonlyArray<string>,
  explicitPrompt?: string
): string | undefined {
  const parts: string[] = [];
  if (dictionaryHints && dictionaryHints.length > 0) {
    parts.push(`Vocabulary: ${dictionaryHints.join(", ")}`);
  }
  if (explicitPrompt) {
    parts.push(explicitPrompt);
  }
  return parts.length > 0 ? parts.join(". ") : undefined;
}

interface Gpt4oTranscribeResponse {
  result: { text: string };
}

export const makeGpt4oTranscribeClient = (env: Env): TranscribeService => ({
  transcribe: (params) =>
    Effect.tryPromise({
      try: async () => {
        const dataUri = arrayBufferToDataUri(params.audio, params.contentType);
        const prompt = buildPrompt(params.dictionaryHints, params.prompt);

        const response = (await env.AI.run(
          GPT4O_TRANSCRIBE_MODEL,
          {
            file: dataUri,
            ...(params.language ? { language: params.language } : {}),
            ...(prompt ? { prompt } : {}),
            ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
          } as Parameters<Env["AI"]["run"]>[1],
          {
            gateway: {
              id: env.AI_GATEWAY_ID,
              ...(params.gatewayMetadata
                ? { metadata: { ...params.gatewayMetadata, model: GPT4O_TRANSCRIBE_MODEL } }
                : {}),
            },
          }
        )) as unknown as Gpt4oTranscribeResponse;

        return {
          engine: GPT4O_TRANSCRIBE_MODEL,
          text: response.result.text,
          duration: 0,
        };
      },
      catch: (e) => new TranscribeError({ message: unknownMessage(e) }),
    }),
});
