import { describe, expect, it } from "@effect/vitest";
import { Effect, Exit, Layer } from "effect";
import { NoopObservabilityLive } from "../../observability/observability";
import {
  SpeechToText,
  type SpeechToTextRequest,
  type SpeechToTextResult,
  type SpeechToTextService,
} from "../../modules/transcription/application/ports/speech-to-text";
import {
  ActionTextTransformer,
  type ActionTextTransformerService,
} from "../../modules/action-mode/application/ports/action-text-transformer";
import { ActionModeExecutionError } from "../../modules/action-mode/errors";
import { runActionPipeline, type RunActionPipelineInput } from "./run-action-pipeline";

interface Capture {
  sttRequest?: SpeechToTextRequest;
  transformParams?: { instruction: string; selectedText: string | null };
}

const sttResult = (text: string): SpeechToTextResult => ({
  engine: "stub-stt",
  text,
  textLength: text.length,
  wordCount: text.trim().split(/\s+/).filter(Boolean).length,
  duration: 2,
  durationMs: 2000,
  detectedLanguage: "pt",
});

const makeStt = (capture: Capture, text: string): SpeechToTextService => ({
  transcribeAudio: (request) => {
    capture.sttRequest = request;
    return Effect.succeed(sttResult(text));
  },
  transcribeRecording: () => Effect.die("not used"),
});

const makeTransformer = (capture: Capture, output: string): ActionTextTransformerService => ({
  transform: ({ instruction, selectedText }) => {
    capture.transformParams = { instruction, selectedText };
    return Effect.succeed({ text: output, engine: "stub-llama" });
  },
});

const baseInput: RunActionPipelineInput = {
  userId: "user-1",
  audio: new ArrayBuffer(16),
  contentType: "audio/webm",
  locale: "auto",
  selectedText: "quanto é um mais um?",
  timezone: "America/Sao_Paulo",
  language: "pt-BR",
  platform: "desktop",
  os: "macos",
  surfaceContext: null,
  bundleId: "com.apple.Notes",
  siteHost: null,
};

function buildLayer(capture: Capture, opts: { sttText: string; output?: string }) {
  return Layer.mergeAll(
    Layer.succeed(SpeechToText, makeStt(capture, opts.sttText)),
    Layer.succeed(ActionTextTransformer, makeTransformer(capture, opts.output ?? "OUTPUT")),
    NoopObservabilityLive
  );
}

function runPipeline(input: RunActionPipelineInput, layer: ReturnType<typeof buildLayer>) {
  return runActionPipeline(input).pipe(Effect.provide(layer), Effect.exit);
}

describe("runActionPipeline", () => {
  it.effect(
    "transcribes the instruction and feeds it with the selected text to the transformer",
    () =>
      Effect.gen(function* () {
        const capture: Capture = {};
        const exit = yield* runPipeline(
          baseInput,
          buildLayer(capture, { sttText: " responda essa pergunta ", output: "dois" })
        );

        expect(capture.transformParams).toEqual({
          instruction: "responda essa pergunta",
          selectedText: "quanto é um mais um?",
        });
        expect(Exit.isSuccess(exit)).toBe(true);
        if (Exit.isSuccess(exit)) {
          expect(exit.value.instructionText).toBe("responda essa pergunta");
          expect(exit.value.outputText).toBe("dois");
          expect(exit.value.sttEngine).toBe("stub-stt");
        }
      })
  );

  it.effect("charges only the spoken instruction's words in the usage draft", () =>
    Effect.gen(function* () {
      const capture: Capture = {};
      const exit = yield* runPipeline(
        baseInput,
        buildLayer(capture, {
          sttText: "escreva como homem das cavernas",
          output: "MIM QUER PEDRA",
        })
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      if (Exit.isSuccess(exit)) {
        const draft = exit.value.usageDraft;
        expect(draft.wordCount).toBe(5);
        expect(draft.inputWordCount).toBe(5);
        expect(draft.engines).toEqual({ stt: "stub-stt", llm: "stub-llama" });
        expect(draft.bundleId).toBe("com.apple.Notes");
        expect(draft.platform).toBe("desktop");
        expect(draft.timezone).toBe("America/Sao_Paulo");
      }
    })
  );

  it.effect("fails with empty_instruction when the recording contains no speech text", () =>
    Effect.gen(function* () {
      const capture: Capture = {};
      const exit = yield* runPipeline(baseInput, buildLayer(capture, { sttText: "   " }));

      expect(capture.transformParams).toBeUndefined();
      expect(exit).toStrictEqual(
        Exit.fail(new ActionModeExecutionError({ message: "empty_instruction" }))
      );
    })
  );

  it.effect("omits the STT language hint when locale is auto and passes it otherwise", () =>
    Effect.gen(function* () {
      const capture: Capture = {};
      yield* runPipeline(baseInput, buildLayer(capture, { sttText: "oi" }));
      expect(capture.sttRequest?.language).toBeUndefined();
      expect(capture.sttRequest?.formattingLanguage).toBe("pt-BR");

      yield* runPipeline({ ...baseInput, locale: "pt" }, buildLayer(capture, { sttText: "oi" }));
      expect(capture.sttRequest?.language).toBe("pt");
    })
  );

  it.effect("supports the no-selection chat scenario", () =>
    Effect.gen(function* () {
      const capture: Capture = {};
      const exit = yield* runPipeline(
        { ...baseInput, selectedText: null },
        buildLayer(capture, { sttText: "escreva um poema sobre água" })
      );

      expect(capture.transformParams?.selectedText).toBeNull();
      expect(Exit.isSuccess(exit)).toBe(true);
    })
  );
});
