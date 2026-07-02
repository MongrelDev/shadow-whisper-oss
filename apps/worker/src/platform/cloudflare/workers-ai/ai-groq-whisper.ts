import { Effect } from "effect";
import { toFile } from "groq-sdk";
import { TranscribeError, type TranscribeService } from "./ai";
import { gatewayMetadataHeaders, isRetryableGroqError, makeGroqClient } from "./groq-client";
import { normalizeDetectedLanguage } from "./detected-language";
import { unknownMessage } from "../../../lib/unknown-message";
import { enrichWideEvent } from "../../../observability/enrich-wide-event";

const GROQ_WHISPER_MODEL = "whisper-large-v3-turbo";

function buildPrompt(
  dictionaryHints?: ReadonlyArray<string>,
  explicitPrompt?: string
): string | undefined {
  const parts: string[] = [];
  if (dictionaryHints && dictionaryHints.length > 0) {
    parts.push(dictionaryHints.join(", "));
  }
  if (explicitPrompt) {
    parts.push(explicitPrompt);
  }
  return parts.length > 0 ? parts.join(". ") : undefined;
}

// Groq sniffs the container from the upload's filename extension; a mismatched
// extension (e.g. WebM bytes named .wav) can fail or degrade decoding.
const EXTENSION_BY_CONTENT_TYPE: Readonly<Record<string, string>> = {
  "audio/webm": "webm",
  "video/webm": "webm",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/ogg": "ogg",
  "audio/opus": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/m4a": "m4a",
  "audio/x-m4a": "m4a",
  "audio/flac": "flac",
};

function fileNameForContentType(contentType: string): string {
  const base = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return `audio.${EXTENSION_BY_CONTENT_TYPE[base] ?? "webm"}`;
}

// Groq expects ISO-639-1 ("pt"); locale-style values ("pt-BR") are rejected.
function normalizeLanguage(language: string | undefined): string | undefined {
  if (!language) return undefined;
  const base = language.trim().toLowerCase().split(/[-_]/)[0];
  return base && /^[a-z]{2,3}$/.test(base) ? base : undefined;
}

// The SDK types `verbose_json` as the base Transcription ({ text }); the extra
// fields ride along untyped.
interface VerboseTranscription {
  text?: string;
  language?: string;
  duration?: number;
}

export const makeGroqWhisperClient = (env: Env): TranscribeService => {
  const client = makeGroqClient(env);

  return {
    transcribe: Effect.fnUntraced(function* (params) {
      const prompt = buildPrompt(params.dictionaryHints, params.prompt);
      const language = normalizeLanguage(params.language);

      const parsed = yield* Effect.tryPromise({
        try: async () => {
          const file = await toFile(
            new Blob([params.audio], { type: params.contentType }),
            fileNameForContentType(params.contentType)
          );
          return (await client.audio.transcriptions.create(
            {
              file,
              model: GROQ_WHISPER_MODEL,
              response_format: "verbose_json",
              ...(language ? { language } : {}),
              ...(prompt ? { prompt } : {}),
              ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
            },
            { headers: gatewayMetadataHeaders(GROQ_WHISPER_MODEL, params.gatewayMetadata) }
          )) as VerboseTranscription;
        },
        catch: (e) => {
          const retryable = isRetryableGroqError(e);
          return new TranscribeError({
            message: `[${GROQ_WHISPER_MODEL}] ${unknownMessage(e)}`,
            ...(retryable !== undefined ? { retryable } : {}),
          });
        },
      });

      const text = parsed.text ?? "";
      const detectedLanguage = normalizeDetectedLanguage(parsed.language);

      yield* enrichWideEvent({
        stt: { model: GROQ_WHISPER_MODEL, textLength: text.length },
      });

      return {
        engine: GROQ_WHISPER_MODEL,
        text,
        duration: parsed.duration ?? 0,
        ...(detectedLanguage ? { detectedLanguage } : {}),
      };
    }),
  };
};
