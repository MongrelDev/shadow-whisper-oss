import { Duration, Effect } from "effect";
import type { SurfaceContext } from "@whisper/api";
import { countWords } from "../../lib/count-words";
import { DictionaryRepository } from "../../modules/dictionary/application/ports/dictionary-repository";
import {
  SpeechToText,
  type SpeechToTextRequest,
} from "../../modules/transcription/application/ports/speech-to-text";
import {
  TextImprover,
  type TextImproverParams,
} from "../../modules/transcription/application/ports/text-improver";
import type { UsageEntry } from "../../modules/usage/application/ports/usage-tracker";
import { languageForUsageStat } from "../../modules/usage/domain/usage-analytics";
import type { MetaContext } from "../../modules/whisper-session/domain/meta-context";
import { TranscriptionFailedError } from "../../modules/whisper-session/errors";
import { Observability } from "../../observability/observability";

export interface RunSessionPipelineInput {
  readonly userId: string;
  readonly sessionId: string;
  readonly audio: ArrayBuffer;
  readonly contentType: string;
  readonly locale: string;
  readonly forcedSkillMarkdown: string | null;
  readonly timezone: string;
  readonly language: string | null;
  readonly platform: "desktop" | "extension";
  readonly os: string;
  readonly surfaceContext: SurfaceContext | null;
  // Hints prefetched at warmup (stored on the session entry). Null means the
  // prefetch failed or predates the feature — fall back to a live lookup.
  readonly prefetchedDictionaryHints: readonly string[] | null;
  readonly meta: MetaContext;
}

export interface RunSessionResult {
  readonly rawText: string;
  readonly improvedText: string;
  readonly sttEngine: string;
  readonly durationMs: number;
}

export interface RunSessionPipelineOutput extends RunSessionResult {
  // Everything the usage ledger needs to record this transcription. The agent
  // persists it on the session entry and evaluates rewards off the hot path,
  // after the transcript has already been returned to the client.
  readonly usageDraft: UsageEntry;
}

const buildTranscribeRequest = (
  input: RunSessionPipelineInput,
  dictionaryHints: ReadonlyArray<string>
): SpeechToTextRequest => ({
  source: { kind: "buffer", audio: input.audio, contentType: input.contentType },
  ...(input.locale && input.locale !== "auto" ? { language: input.locale } : {}),
  ...(input.language ? { formattingLanguage: input.language } : {}),
  ...(dictionaryHints.length > 0 ? { dictionaryHints } : {}),
});

const buildImproveParams = (
  input: RunSessionPipelineInput,
  rawText: string,
  detectedLanguage: string | null
): TextImproverParams => {
  const base = {
    userId: input.userId,
    rawText,
    surface: input.platform,
    bundleId: input.meta.bundleId,
    appHost: input.meta.siteHost,
    surfaceContext: input.surfaceContext,
    detectedLanguage,
    timezone: input.timezone,
  };
  return input.forcedSkillMarkdown
    ? { mode: "forced-skill", ...base, skillMarkdown: input.forcedSkillMarkdown }
    : { mode: "voice-skills", ...base };
};

export const runSessionPipeline = Effect.fnUntraced(function* (input: RunSessionPipelineInput) {
  const obs = yield* Observability;
  const stt = yield* SpeechToText;
  const textImprover = yield* TextImprover;
  const dictionaryRepository = yield* DictionaryRepository;

  const transcriptionId = crypto.randomUUID();

  const dictionaryHints =
    input.prefetchedDictionaryHints ??
    (yield* dictionaryRepository.getDictionary(input.userId).pipe(
      Effect.map((d) => d.words.map((w) => w.word)),
      Effect.catch(() => Effect.succeed([] as string[])),
      Effect.withSpan("do.dictionary-lookup")
    ));

  yield* obs.setWideEvent({
    "session.operation": "agent_run_session",
    "session.mode": input.forcedSkillMarkdown ? "ForcedSkill" : "VoiceSkills",
    sessionId: input.sessionId,
    transcriptionId,
    locale: input.locale,
    audioBytes: input.audio.byteLength,
    contentType: input.contentType,
    dictionaryHintsCount: dictionaryHints.length,
    hasBundleId: input.meta.bundleId !== null,
    bundleId: input.meta.bundleId,
    hasSiteHost: input.meta.siteHost !== null,
    siteHost: input.meta.siteHost,
  });

  const [sttWallDuration, sttResult] = yield* stt
    .transcribeAudio(buildTranscribeRequest(input, dictionaryHints))
    .pipe(
      Effect.mapError((e) => new TranscriptionFailedError({ message: e.message })),
      Effect.tapError((error) => obs.failWideEvent(error)),
      Effect.withSpan("do.stt", {
        attributes: {
          "audio.contentType": input.contentType,
          "audio.bytes": input.audio.byteLength,
          "session.locale": input.locale,
        },
      }),
      Effect.timed
    );

  yield* obs.setWideEvent({
    sttCompleted: true,
    sttEngine: sttResult.engine,
    rawTextLength: sttResult.textLength,
    wordCount: sttResult.wordCount,
    audioDurationMs: sttResult.durationMs,
    sttWallMs: Duration.toMillis(sttWallDuration),
    detectedLanguage: sttResult.detectedLanguage ?? null,
  });

  const [llmWallDuration, improvedText] = yield* textImprover
    .improve(buildImproveParams(input, sttResult.text, sttResult.detectedLanguage ?? null))
    .pipe(
      Effect.mapError((e) => new TranscriptionFailedError({ message: e.message })),
      Effect.withSpan("do.llm-improve", {
        attributes: {
          "session.mode": input.forcedSkillMarkdown ? "ForcedSkill" : "VoiceSkills",
          "input.length": sttResult.text.length,
        },
      }),
      Effect.timed,
      Effect.tapError((e) => obs.failWideEvent(e))
    );

  yield* obs.setWideEvent({ llmWallMs: Duration.toMillis(llmWallDuration) });

  const wordCount = countWords(sttResult.text);

  const usageDraft: UsageEntry = {
    id: transcriptionId,
    wordCount,
    inputWordCount: wordCount,
    bundleId: input.meta.bundleId,
    siteHost: input.meta.siteHost,
    surfaceContext: input.surfaceContext,
    engines: { stt: sttResult.engine, llm: null },
    durationMs: sttResult.durationMs,
    createdAt: Date.now(),
    platform: input.platform,
    os: input.os,
    language: languageForUsageStat(sttResult.detectedLanguage, wordCount, sttResult.durationMs),
    timezone: input.timezone,
  };

  yield* obs.setWideEvent({ agentRunSessionCompleted: true });

  return {
    rawText: sttResult.text,
    improvedText,
    sttEngine: sttResult.engine,
    durationMs: sttResult.durationMs,
    usageDraft,
  } satisfies RunSessionPipelineOutput;
});
