import { Buffer } from "node:buffer";
import { Effect } from "effect";
import { TranscribeError, type GatewayMetadata, type TranscribeService } from "./ai";
import { unknownMessage } from "../../../lib/unknown-message";
import { enrichWideEvent } from "../../../observability/enrich-wide-event";

const WHISPER_MODEL = "@cf/openai/whisper-large-v3-turbo";

const buildGatewayOptions = (env: Env, gatewayMetadata?: GatewayMetadata) => ({
  gateway: {
    id: env.AI_GATEWAY_ID,
    ...(gatewayMetadata ? { metadata: { ...gatewayMetadata, model: WHISPER_MODEL } } : {}),
  },
});

function normalizeLang(lang: string | null | undefined): string | undefined {
  if (!lang) return undefined;
  const lower = lang.toLowerCase().trim();
  if (!lower || lower === "multi" || lower === "auto") return undefined;
  return lower.split("-")[0];
}

// whisper-large-v3-turbo nests duration/language under transcription_info; only
// older models surfaced them at the top level. Read both so either shape works.
interface WhisperResult {
  text?: string;
  duration?: number;
  language?: string;
  transcription_info?: {
    language?: string;
    duration?: number;
    duration_after_vad?: number;
  };
}

function extractWhisperLanguage(
  result: WhisperResult,
  pinnedLanguage: string | undefined
): string | undefined {
  const rawLang = result.transcription_info?.language ?? result.language;
  if (typeof rawLang === "string") return normalizeLang(rawLang);
  if (pinnedLanguage && pinnedLanguage !== "auto") return normalizeLang(pinnedLanguage);
  return undefined;
}

function extractDuration(result: WhisperResult): number {
  return result.transcription_info?.duration ?? result.duration ?? 0;
}

function toTranscription(result: WhisperResult, pinnedLanguage: string | undefined) {
  const detectedLanguage = extractWhisperLanguage(result, pinnedLanguage);
  const durationAfterVad = result.transcription_info?.duration_after_vad;
  return {
    engine: WHISPER_MODEL,
    text: result.text ?? "",
    duration: extractDuration(result),
    ...(detectedLanguage ? { detectedLanguage } : {}),
    ...(durationAfterVad !== undefined ? { durationAfterVad } : {}),
  };
}

function buildWhisperPrompt(
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

export const makeWhisperClient = (env: Env): TranscribeService => ({
  transcribe: Effect.fnUntraced(function* (params) {
    const prompt = buildWhisperPrompt(params.dictionaryHints, params.prompt);
    // The input schema takes an ISO 639-1 code; locale-style values ("pt-BR")
    // and "auto"/"multi" sentinels must not be pinned.
    const language = normalizeLang(params.language);
    // whisper-large-v3-turbo expects audio as a base64 string (per the binding
    // input type: `audio: string | { body, contentType }`), not a byte array.
    const audioBase64 = Buffer.from(params.audio).toString("base64");

    yield* enrichWideEvent({
      stt: {
        model: WHISPER_MODEL,
        audioBytes: params.audio.byteLength,
        hasPrompt: !!prompt,
        language: language ?? "auto",
      },
    });

    const result = yield* Effect.tryPromise({
      try: () =>
        env.AI.run(
          WHISPER_MODEL,
          {
            audio: audioBase64,
            ...(prompt ? { initial_prompt: prompt } : {}),
            ...(language ? { language } : {}),
            task: "transcribe",
            // Greedy decoding (beam_size 1, default 5) — the standard Whisper
            // latency knob. Dictation is short-form clean speech, where beam
            // search adds wall time with negligible accuracy gain.
            beam_size: 1,
            vad_filter: true,
            condition_on_previous_text: false,
            hallucination_silence_threshold: 2.0,
          } as Parameters<Env["AI"]["run"]>[1],
          buildGatewayOptions(env, params.gatewayMetadata)
        ) as Promise<WhisperResult>,
      catch: (e) => new TranscribeError({ message: `[${WHISPER_MODEL}] ${unknownMessage(e)}` }),
    });

    return toTranscription(result, language);
  }),
});
