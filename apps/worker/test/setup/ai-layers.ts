import { Effect, Layer } from "effect";
import {
  SpeechToText,
  type SpeechToTextService,
  type SpeechToTextResult,
} from "../../src/modules/transcription/application/ports/speech-to-text";
import {
  SkillExecutor,
  type SkillExecutorService,
} from "../../src/modules/skills-catalog/application/ports/skill-executor";
import {
  TextGenerator,
  type TextGeneratorService,
} from "../../src/modules/transcription/application/ports/text-generator";
import {
  AutoEditValidator,
  type AutoEditValidatorService,
} from "../../src/modules/feedback/application/ports/auto-edit-validator";

interface TestSpeechToTextOptions {
  text?: string;
  duration?: number;
  engine?: "whisper" | "nova";
}

export const makeTestSpeechToText = (opts: TestSpeechToTextOptions = {}): SpeechToTextService => {
  const text = opts.text ?? "this is a mocked transcription";
  const result: SpeechToTextResult = {
    engine: opts.engine ?? "whisper",
    text,
    textLength: text.length,
    wordCount: text.split(/\s+/).length,
    duration: opts.duration ?? 1.5,
    durationMs: (opts.duration ?? 1.5) * 1000,
    detectedLanguage: "en",
  };

  return {
    transcribeAudio: () => Effect.succeed(result),
    transcribeRecording: () => Effect.succeed(result),
  };
};

export const TestSpeechToTextLive = (opts?: TestSpeechToTextOptions) =>
  Layer.succeed(SpeechToText, makeTestSpeechToText(opts));

interface TestSkillExecutorOptions {
  response?: string;
}

export const makeTestSkillExecutor = (
  opts: TestSkillExecutorOptions = {}
): SkillExecutorService => ({
  execute: () => Effect.succeed(opts.response ?? "polished mocked output"),
});

export const TestSkillExecutorLive = (opts?: TestSkillExecutorOptions) =>
  Layer.succeed(SkillExecutor, makeTestSkillExecutor(opts));

interface TestAutoEditValidatorOptions {
  accepted?: ReadonlyArray<{ from: string; to: string; context: string }>;
}

export const makeTestAutoEditValidator = (
  opts: TestAutoEditValidatorOptions = {}
): AutoEditValidatorService => ({
  validate: (input) =>
    Effect.succeed({
      accepted:
        opts.accepted ??
        input.candidates.map((c) => ({ from: c.from, to: c.to, context: "test context" })),
    }),
});

export const TestAutoEditValidatorLive = (opts?: TestAutoEditValidatorOptions) =>
  Layer.succeed(AutoEditValidator, makeTestAutoEditValidator(opts));

interface TestTextGeneratorOptions {
  response?: string;
}

// Echoes the transcript back (or a fixed response) so the full improve pipeline
// runs without touching real generators — the Groq fallback is BYOK and bills the
// account on every call.
export const makeTestTextGenerator = (
  opts: TestTextGeneratorOptions = {}
): TextGeneratorService => ({
  generate: (req) => {
    if (opts.response !== undefined) return Effect.succeed(opts.response);
    const transcript = req.prompt.match(/<transcript>\n?([\s\S]*?)\n?<\/transcript>/);
    return Effect.succeed((transcript?.[1] ?? req.prompt).trim());
  },
});

export const TestTextGeneratorLive = (opts?: TestTextGeneratorOptions) =>
  Layer.succeed(TextGenerator, makeTestTextGenerator(opts));
