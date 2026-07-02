import { Duration, Effect } from "effect";
import { TranscribeError, type TranscribeService } from "./ai";
import { arrayBufferToDataUri } from "./array-buffer-to-data-uri";
import { unknownMessage } from "../../../lib/unknown-message";
import { enrichWideEvent } from "../../../observability/enrich-wide-event";

const ASSEMBLYAI_MODEL = "assemblyai/universal-3-pro";
const MAX_KEYTERMS = 1000;

function mergeKeyterms(
  dictionaryHints?: ReadonlyArray<string>,
  keytermsPrompt?: ReadonlyArray<string>
): string[] {
  const all = [...(dictionaryHints ?? []), ...(keytermsPrompt ?? [])];
  const unique = [...new Set(all)];
  return unique.slice(0, MAX_KEYTERMS);
}

function extractDuration(result: { words?: Array<{ end?: number }> }): number {
  if (!result.words || result.words.length === 0) return 0;
  const lastWord = result.words[result.words.length - 1]!;
  return (lastWord.end ?? 0) / 1000;
}

function extractDetectedLanguage(result: { language_code?: string }): string | undefined {
  return result.language_code ?? undefined;
}

function buildAssemblyAiInput(params: {
  language?: string;
  prompt?: string;
  dictionaryHints?: ReadonlyArray<string>;
  keytermsPrompt?: ReadonlyArray<string>;
  speakerLabels?: boolean;
  temperature?: number;
  filterProfanity?: boolean;
}): Record<string, unknown> {
  const keyterms = mergeKeyterms(params.dictionaryHints, params.keytermsPrompt);
  return {
    ...(params.language ? { language_code: params.language } : {}),
    ...(keyterms.length > 0 ? { word_boost: keyterms } : {}),
    ...(params.speakerLabels ? { speaker_labels: true } : {}),
    ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
    ...(params.filterProfanity ? { filter_profanity: true } : {}),
  };
}

interface AssemblyAiResponse {
  result?: {
    text: string;
    words?: Array<{ end?: number }>;
    language_code?: string;
  };
}

export const makeAssemblyAiClient = (env: Env): TranscribeService => ({
  transcribe: Effect.fnUntraced(function* (params) {
    const dataUri = arrayBufferToDataUri(params.audio, params.contentType);
    const input = buildAssemblyAiInput(params);

    const [apiDuration, response] = yield* Effect.tryPromise({
      try: () =>
        env.AI.run(
          ASSEMBLYAI_MODEL,
          { audio_url: dataUri, ...input } as Parameters<Env["AI"]["run"]>[1],
          {
            gateway: {
              id: env.AI_GATEWAY_ID,
              ...(params.gatewayMetadata
                ? { metadata: { ...params.gatewayMetadata, model: ASSEMBLYAI_MODEL } }
                : {}),
            },
          }
        ) as Promise<AssemblyAiResponse>,
      catch: (e) => new TranscribeError({ message: unknownMessage(e) }),
    }).pipe(Effect.timed);

    const apiMs = Duration.toMillis(apiDuration);
    const result = response.result;
    if (!result) {
      return yield* new TranscribeError({ message: "No result from AssemblyAI" });
    }

    const text = result.text;
    const duration = extractDuration(result);
    const detectedLanguage = extractDetectedLanguage(result);
    const keyterms = mergeKeyterms(params.dictionaryHints, params.keytermsPrompt);

    yield* enrichWideEvent({
      stt: {
        model: ASSEMBLYAI_MODEL,
        apiMs,
        audioBytes: params.audio.byteLength,
        textLength: text.length,
        keytermsCount: keyterms.length,
        language: params.language,
        detectedLanguage,
      },
    });

    return {
      engine: ASSEMBLYAI_MODEL,
      text,
      duration,
      ...(detectedLanguage ? { detectedLanguage } : {}),
    };
  }),
});
