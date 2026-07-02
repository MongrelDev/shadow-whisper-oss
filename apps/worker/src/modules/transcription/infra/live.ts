import { Effect, Layer, Schedule } from "effect";
import { makeWhisperClient } from "../../../platform/cloudflare/workers-ai/ai-whisper";
import { makeAssemblyAiClient } from "../../../platform/cloudflare/workers-ai/ai-assemblyai";
import { makeGpt4oTranscribeClient } from "../../../platform/cloudflare/workers-ai/ai-gpt4o-transcribe";
import { makeGroqWhisperClient } from "../../../platform/cloudflare/workers-ai/ai-groq-whisper";
import { makeGrokSttClient } from "../../../platform/cloudflare/workers-ai/ai-grok-stt";
import { DictionaryRepositoryLive } from "../../dictionary/infra/live";
import { SkillInstallationRepositoryLive } from "../../skills-catalog/infra/live";
import { SkillRepository } from "../../skills/application/ports/skill-repository";
import { SkillsLive } from "../../skills/infra/bundled-skill-repository";
import { WhisperMemoryLive } from "../../whisper-memory/infra/live";
import { AppCategoryRepository } from "../application/ports/app-category-repository";
import { SpeechToText } from "../application/ports/speech-to-text";
import { TextGenerator } from "../application/ports/text-generator";
import { ImprovementFlowSelectorLive } from "../application/improvement-flow-selector";
import { TextImproverServiceLive } from "../application/text-improver-service";
import { makeD1AppCategoryRepository } from "./d1-app-category-repository";
import { makeWorkersAiSpeechToText } from "./workers-ai-speech-to-text";
import { makeWorkersAiTextGenerator } from "./workers-ai-text-generator";
import { makeGroqTextGenerator } from "./groq-text-generator";
import { makeFallbackSpeechToText, withSttRetry } from "./fallback-speech-to-text";
import { makeFallbackTextGenerator } from "./fallback-text-generator";
import { createDb } from "@whisper/db";

export const WhisperSpeechToTextLive = (env: Env) =>
  Layer.succeed(SpeechToText, makeWorkersAiSpeechToText(makeWhisperClient(env)));

export const AssemblyAiSpeechToTextLive = (env: Env) =>
  Layer.succeed(SpeechToText, makeWorkersAiSpeechToText(makeAssemblyAiClient(env)));

export const Gpt4oTranscribeSpeechToTextLive = (env: Env) =>
  Layer.succeed(SpeechToText, makeWorkersAiSpeechToText(makeGpt4oTranscribeClient(env)));

export const AssemblyAiWithWhisperFallbackLive = (env: Env) =>
  Layer.succeed(
    SpeechToText,
    makeFallbackSpeechToText(
      makeWorkersAiSpeechToText(makeAssemblyAiClient(env)),
      makeWorkersAiSpeechToText(makeWhisperClient(env))
    )
  );

export const Gpt4oWithWhisperFallbackLive = (env: Env) =>
  Layer.succeed(
    SpeechToText,
    makeFallbackSpeechToText(
      makeWorkersAiSpeechToText(makeGpt4oTranscribeClient(env)),
      makeWorkersAiSpeechToText(makeWhisperClient(env))
    )
  );

export const WhisperWithGpt4oFallbackLive = (env: Env) =>
  Layer.succeed(
    SpeechToText,
    makeFallbackSpeechToText(
      makeWorkersAiSpeechToText(makeWhisperClient(env)),
      makeWorkersAiSpeechToText(makeGpt4oTranscribeClient(env))
    )
  );

// Per-engine retry: 2 attempts (1 immediate retry, no backoff) for each STT
// engine. Retry stays inside each engine so a transient failure retries the same
// engine; only after both attempts fail does the fallback move on. Sequence:
// Groq, Groq, CF, CF.
const STT_ENGINE_RETRY = Schedule.recurs(1);

export const GroqWhisperWithCfFallbackLive = (env: Env) =>
  Layer.succeed(
    SpeechToText,
    makeFallbackSpeechToText(
      withSttRetry(makeWorkersAiSpeechToText(makeGroqWhisperClient(env)), STT_ENGINE_RETRY),
      withSttRetry(makeWorkersAiSpeechToText(makeWhisperClient(env)), STT_ENGINE_RETRY)
    )
  );

export const CfWhisperWithGroqFallbackLive = (env: Env) =>
  Layer.succeed(
    SpeechToText,
    makeFallbackSpeechToText(
      withSttRetry(makeWorkersAiSpeechToText(makeWhisperClient(env)), STT_ENGINE_RETRY),
      withSttRetry(makeWorkersAiSpeechToText(makeGroqWhisperClient(env)), STT_ENGINE_RETRY)
    )
  );

export const GrokSttSpeechToTextLive = (env: Env) =>
  Layer.succeed(SpeechToText, makeWorkersAiSpeechToText(makeGrokSttClient(env)));

export const GrokWithCfWhisperFallbackLive = (env: Env) =>
  Layer.succeed(
    SpeechToText,
    makeFallbackSpeechToText(
      withSttRetry(makeWorkersAiSpeechToText(makeGrokSttClient(env)), STT_ENGINE_RETRY),
      withSttRetry(makeWorkersAiSpeechToText(makeWhisperClient(env)), STT_ENGINE_RETRY)
    )
  );

export const CfWhisperWithGrokFallbackLive = (env: Env) =>
  Layer.succeed(
    SpeechToText,
    makeFallbackSpeechToText(
      withSttRetry(makeWorkersAiSpeechToText(makeWhisperClient(env)), STT_ENGINE_RETRY),
      withSttRetry(makeWorkersAiSpeechToText(makeGrokSttClient(env)), STT_ENGINE_RETRY)
    )
  );

/** @deprecated */
export const SpeechToTextLive = WhisperSpeechToTextLive;

const TextImproverDepsLive = (env: Env) => {
  const db = createDb(env.DB);
  return Layer.mergeAll(
    SkillsLive(),
    WhisperMemoryLive(env),
    DictionaryRepositoryLive(env),
    SkillInstallationRepositoryLive(env),
    Layer.succeed(AppCategoryRepository, makeD1AppCategoryRepository(db))
  );
};

export const GroqLlamaWithCfFallbackTextGeneratorLive = (env: Env) =>
  Layer.effect(
    TextGenerator,
    Effect.gen(function* () {
      const skillLoader = yield* SkillRepository;
      return makeFallbackTextGenerator(
        makeGroqTextGenerator(env, skillLoader),
        makeWorkersAiTextGenerator(env, skillLoader)
      );
    })
  );

export const CfGemmaWithGroqFallbackTextGeneratorLive = (env: Env) =>
  Layer.effect(
    TextGenerator,
    Effect.gen(function* () {
      const skillLoader = yield* SkillRepository;
      return makeFallbackTextGenerator(
        makeWorkersAiTextGenerator(env, skillLoader),
        makeGroqTextGenerator(env, skillLoader)
      );
    })
  );

export interface TextImproverFactoryOptions {
  readonly textGeneratorLayer?: Layer.Layer<TextGenerator>;
}

export const TextImproverFactory = (env: Env, opts?: TextImproverFactoryOptions) => {
  const deps = TextImproverDepsLive(env);
  const generator = (
    opts?.textGeneratorLayer ?? GroqLlamaWithCfFallbackTextGeneratorLive(env)
  ).pipe(Layer.provide(deps));
  const flowSelector = ImprovementFlowSelectorLive.pipe(Layer.provide(deps));
  return TextImproverServiceLive.pipe(Layer.provide([deps, generator, flowSelector]));
};

export const TranscriptionAiLive = (env: Env) => {
  const services = TextImproverFactory(env);
  return Layer.mergeAll(SpeechToTextLive(env), services);
};

export const TranscriptionLive = (env: Env) => TranscriptionAiLive(env);
