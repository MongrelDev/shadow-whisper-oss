import { Duration, Effect } from "effect";
import { TranscribeError, type GatewayMetadata, type TranscribeService } from "./ai";
import { arrayBufferToDataUri } from "./array-buffer-to-data-uri";
import { normalizeDetectedLanguage } from "./detected-language";
import { GROK_STT_MODEL } from "./models";
import { unknownMessage } from "../../../lib/unknown-message";
import { enrichWideEvent } from "../../../observability/enrich-wide-event";

// Grok STT keyterm biasing limits (xAI doc): up to 100 terms, 50 chars each.
const MAX_KEYTERMS = 100;
const MAX_KEYTERM_CHARS = 50;

const buildGatewayOptions = (env: Env, gatewayMetadata?: GatewayMetadata) => ({
  gateway: {
    id: env.AI_GATEWAY_ID,
    ...(gatewayMetadata ? { metadata: { ...gatewayMetadata, model: GROK_STT_MODEL } } : {}),
  },
});

// The user dictionary (dictionaryHints) and any explicit keytermsPrompt both bias
// recognition at the source. Merge, trim, drop empties/over-long terms, dedupe,
// then cap to the model's limits.
function mergeKeyterms(
  dictionaryHints?: ReadonlyArray<string>,
  keytermsPrompt?: ReadonlyArray<string>
): string[] {
  const all = [...(dictionaryHints ?? []), ...(keytermsPrompt ?? [])]
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= MAX_KEYTERM_CHARS);
  return [...new Set(all)].slice(0, MAX_KEYTERMS);
}

// Languages Grok can format (ITN) when `language` + `format:true` are set. The
// `language` param never affects recognition — Grok always auto-detects — so an
// unsupported or mismatched value is simply dropped, leaving raw (unformatted) text.
// Source: xAI STT docs "Supported languages".
const GROK_FORMATTING_LANGUAGES = new Set([
  "ar",
  "cs",
  "da",
  "nl",
  "en",
  "fil",
  "fr",
  "de",
  "hi",
  "id",
  "it",
  "ja",
  "ko",
  "mk",
  "ms",
  "fa",
  "pl",
  "pt",
  "ro",
  "ru",
  "es",
  "sv",
  "th",
  "tr",
  "vi",
]);

function resolveFormattingLanguage(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const base = raw.trim().toLowerCase().split(/[-_]/)[0];
  return base && GROK_FORMATTING_LANGUAGES.has(base) ? base : undefined;
}

// The binding nests the transcription under `result` (alongside a top-level
// `state`), matching the AssemblyAI/gpt4o wrappers rather than Whisper's flat shape.
interface GrokSttResponse {
  state?: string;
  result?: {
    text?: string;
    language?: string;
    duration?: number;
  };
}

// Recognition is always auto-detect — we never pin a recognition language.
// `language` + `format:true` only enable Inverse Text Normalization (numbers,
// currency, units) in the user's language, and only for supported languages.
// No `diarize` (single speaker).
const buildRunInput = (
  file: string,
  formattingLanguage: string | undefined,
  keyterms: string[]
): Parameters<Env["AI"]["run"]>[1] =>
  ({
    file,
    ...(formattingLanguage ? { language: formattingLanguage, format: true } : {}),
    ...(keyterms.length > 0 ? { keyterm: keyterms } : {}),
  }) as Parameters<Env["AI"]["run"]>[1];

interface MappedGrokResult {
  text: string;
  duration: number;
  detectedLanguage: string | undefined;
}

const mapResponse = (response: GrokSttResponse): MappedGrokResult => {
  const result = response.result;
  return {
    text: result?.text ?? "",
    duration: result?.duration ?? 0,
    detectedLanguage: normalizeDetectedLanguage(result?.language),
  };
};

export const makeGrokSttClient = (env: Env): TranscribeService => ({
  transcribe: (params) =>
    Effect.gen(function* () {
      const file = arrayBufferToDataUri(params.audio, params.contentType);
      const keyterms = mergeKeyterms(params.dictionaryHints, params.keytermsPrompt);
      const formattingLanguage = resolveFormattingLanguage(params.formattingLanguage);

      const [apiDuration, response] = yield* Effect.tryPromise({
        try: () =>
          env.AI.run(
            GROK_STT_MODEL,
            buildRunInput(file, formattingLanguage, keyterms),
            buildGatewayOptions(env, params.gatewayMetadata)
          ) as Promise<GrokSttResponse>,
        catch: (e) => new TranscribeError({ message: `[${GROK_STT_MODEL}] ${unknownMessage(e)}` }),
      }).pipe(Effect.timed);

      const { text, duration, detectedLanguage } = mapResponse(response);

      yield* enrichWideEvent({
        stt: {
          model: GROK_STT_MODEL,
          apiMs: Duration.toMillis(apiDuration),
          audioBytes: params.audio.byteLength,
          contentType: params.contentType,
          textLength: text.length,
          keytermsCount: keyterms.length,
          formattingLanguage: formattingLanguage ?? "none",
          detectedLanguage,
        },
      });

      return {
        engine: GROK_STT_MODEL,
        text,
        duration,
        ...(detectedLanguage ? { detectedLanguage } : {}),
      };
    }),
});
