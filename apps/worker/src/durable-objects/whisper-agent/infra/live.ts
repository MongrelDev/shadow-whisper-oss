import { Layer } from "effect";
import { DictionaryRepositoryLive } from "../../../modules/dictionary/infra/live";
import { SpeechToText } from "../../../modules/transcription/application/ports/speech-to-text";
import { TextGenerator } from "../../../modules/transcription/application/ports/text-generator";
import {
  GroqWhisperWithCfFallbackLive,
  TextImproverFactory,
} from "../../../modules/transcription/infra/live";

// Test seam. STT now runs inside the Durable Object, so the worker-side
// `speechToTextLayer` override no longer reaches it; integration tests route their
// fake engine here instead (forwarded from whisper-session/runtime). Module-level
// so the worker realm and the test realm share one slot under vitest-pool-workers.
let sttOverride: Layer.Layer<SpeechToText> | undefined;
let textGeneratorOverride: Layer.Layer<TextGenerator> | undefined;

export const _whisperAgentTestSeam = {
  setSpeechToText: (layer: Layer.Layer<SpeechToText>) => {
    sttOverride = layer;
  },
  setTextGenerator: (layer: Layer.Layer<TextGenerator>) => {
    textGeneratorOverride = layer;
  },
  reset: () => {
    sttOverride = undefined;
    textGeneratorOverride = undefined;
  },
};

// Groq whisper-large-v3-turbo is the primary STT (BYOK through the AI Gateway
// native endpoint): accepts WebM, ~216x realtime vs CF Whisper's ~10x, biasing
// via prompt, detected language in verbose_json. CF Whisper is the fallback —
// slower but always available and format-compatible with the same WebM audio.
export const makeWhisperAgentLayer = (env: Env) =>
  Layer.mergeAll(
    sttOverride ?? GroqWhisperWithCfFallbackLive(env),
    TextImproverFactory(
      env,
      textGeneratorOverride ? { textGeneratorLayer: textGeneratorOverride } : undefined
    ),
    DictionaryRepositoryLive(env)
  );
