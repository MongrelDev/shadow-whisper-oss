import { Duration, Effect } from "effect";
import type { SurfaceContext } from "@whisper/api";
import { countWords } from "../../lib/count-words";
import {
  SpeechToText,
  type SpeechToTextRequest,
} from "../../modules/transcription/application/ports/speech-to-text";
import { ActionTextTransformer } from "../../modules/action-mode/application/ports/action-text-transformer";
import { ActionModeExecutionError } from "../../modules/action-mode/errors";
import type { ActionResult } from "../../modules/action-mode/domain/action-result";
import type { UsageEntry } from "../../modules/usage/application/ports/usage-tracker";
import { languageForUsageStat } from "../../modules/usage/domain/usage-analytics";
import { collapseRepeatedRuns } from "../../modules/transcription/domain/collapse-repetition";
import { Observability } from "../../observability/observability";

export interface RunActionPipelineInput {
  readonly userId: string;
  readonly audio: ArrayBuffer;
  readonly contentType: string;
  readonly locale: string;
  readonly selectedText: string | null;
  readonly timezone: string;
  readonly language: string | null;
  readonly platform: "desktop" | "extension";
  readonly os: string;
  readonly surfaceContext: SurfaceContext | null;
  readonly bundleId: string | null;
  readonly siteHost: string | null;
}

export interface RunActionPipelineOutput extends ActionResult {
  // Everything the usage ledger needs to record this action. Only the spoken
  // instruction's word count is charged, mirroring a normal dictation; the
  // selected text and the generated output are never persisted.
  readonly usageDraft: UsageEntry;
}

const buildTranscribeRequest = (input: RunActionPipelineInput): SpeechToTextRequest => ({
  source: { kind: "buffer", audio: input.audio, contentType: input.contentType },
  ...(input.locale && input.locale !== "auto" ? { language: input.locale } : {}),
  ...(input.language ? { formattingLanguage: input.language } : {}),
});

const buildStartEvent = (input: RunActionPipelineInput, actionId: string) => ({
  "session.operation": "agent_run_action_mode",
  actionId,
  locale: input.locale,
  audioBytes: input.audio.byteLength,
  contentType: input.contentType,
  hasSelectedText: input.selectedText !== null,
  selectedTextLength: input.selectedText?.length ?? 0,
  hasBundleId: input.bundleId !== null,
  bundleId: input.bundleId,
  hasSiteHost: input.siteHost !== null,
  siteHost: input.siteHost,
});

export const runActionPipeline = Effect.fnUntraced(function* (input: RunActionPipelineInput) {
  const obs = yield* Observability;
  const stt = yield* SpeechToText;
  const transformer = yield* ActionTextTransformer;

  const actionId = crypto.randomUUID();

  yield* obs.setWideEvent(buildStartEvent(input, actionId));

  const [sttWallDuration, sttResult] = yield* stt
    .transcribeAudio(buildTranscribeRequest(input))
    .pipe(
      Effect.mapError((e) => new ActionModeExecutionError({ message: e.message })),
      Effect.tapError((error) => obs.failWideEvent(error)),
      Effect.withSpan("do.action-stt", {
        attributes: {
          "audio.contentType": input.contentType,
          "audio.bytes": input.audio.byteLength,
          "session.locale": input.locale,
        },
      }),
      Effect.timed
    );

  const instructionText = collapseRepeatedRuns(sttResult.text).trim();
  if (!instructionText) {
    return yield* new ActionModeExecutionError({ message: "empty_instruction" });
  }

  yield* obs.setWideEvent({
    sttCompleted: true,
    sttEngine: sttResult.engine,
    instructionLength: instructionText.length,
    audioDurationMs: sttResult.durationMs,
    sttWallMs: Duration.toMillis(sttWallDuration),
    detectedLanguage: sttResult.detectedLanguage ?? null,
  });

  const [llmWallDuration, outcome] = yield* transformer
    .transform({
      instruction: instructionText,
      selectedText: input.selectedText,
      gatewayMetadata: { flow: "action-mode.execute", userId: input.userId, actionId },
    })
    .pipe(
      Effect.mapError((e) => new ActionModeExecutionError({ message: e.message })),
      Effect.withSpan("do.action-transform", {
        attributes: { "instruction.length": instructionText.length },
      }),
      Effect.timed,
      Effect.tapError((e) => obs.failWideEvent(e))
    );

  yield* obs.setWideEvent({ llmWallMs: Duration.toMillis(llmWallDuration) });

  // An empty transform result is surfaced to the client as a failure (nothing is
  // inserted), so fail here too — otherwise usage is recorded for a run the user
  // sees as failed, billing them for no output.
  const outputText = outcome.text.trim();
  if (!outputText) {
    return yield* new ActionModeExecutionError({ message: "empty_output" });
  }

  const instructionWordCount = countWords(instructionText);
  const outputWordCount = countWords(outputText);

  const usageDraft: UsageEntry = {
    id: actionId,
    wordCount: instructionWordCount,
    inputWordCount: instructionWordCount,
    bundleId: input.bundleId,
    siteHost: input.siteHost,
    surfaceContext: input.surfaceContext,
    engines: { stt: sttResult.engine, llm: outcome.engine },
    durationMs: sttResult.durationMs,
    createdAt: Date.now(),
    platform: input.platform,
    os: input.os,
    language: languageForUsageStat(
      sttResult.detectedLanguage,
      instructionWordCount,
      sttResult.durationMs
    ),
    timezone: input.timezone,
  };

  yield* obs.setWideEvent({ agentRunActionModeCompleted: true });

  return {
    instructionText,
    outputText,
    instructionWordCount,
    outputWordCount,
    sttEngine: sttResult.engine,
    durationMs: sttResult.durationMs,
    usageDraft,
  } satisfies RunActionPipelineOutput;
});
