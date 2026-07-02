import { Effect } from "effect";
import {
  TranscribeError,
  type TranscribeResult,
  type TranscribeService,
} from "../../../platform/cloudflare/workers-ai/ai";
import {
  SpeechToTextError,
  type AudioSource,
  type SpeechToTextRecordingRequest,
  type SpeechToTextRequest,
  type SpeechToTextService,
} from "../application/ports/speech-to-text";
import { countWords } from "../../../lib/count-words";
import { unknownMessage } from "../../../lib/unknown-message";
import { wavDurationSeconds } from "../../../lib/wav-duration";
import { REQUEST_TIMEOUT_MS, withRequestTimeout } from "../../../lib/request-timeout";
import { enrichWideEvent } from "../../../observability/enrich-wide-event";

const DEFAULT_AUDIO_CONTENT_TYPE = "audio/webm";

interface NormalizedAudio {
  readonly audio: ArrayBuffer;
  readonly contentType: string;
}

const normalizeAudioSource = (
  source: AudioSource
): Effect.Effect<NormalizedAudio, SpeechToTextError> => {
  if (source.kind === "buffer") {
    return Effect.succeed({ audio: source.audio, contentType: source.contentType });
  }
  return Effect.tryPromise({
    try: async () => ({
      audio: await source.audio.arrayBuffer(),
      contentType: source.contentType || source.audio.type || DEFAULT_AUDIO_CONTENT_TYPE,
    }),
    catch: (e) => new SpeechToTextError({ message: unknownMessage(e) }),
  });
};

function describeTranscriptionInput(params: {
  audio: ArrayBuffer;
  contentType: string;
  prompt?: string;
  language?: string;
}) {
  return {
    contentType: params.contentType,
    audioBytes: params.audio.byteLength,
    language: params.language ?? "auto",
    hasPrompt: !!params.prompt,
    promptTerms: params.prompt
      ? params.prompt
          .split(",")
          .map((term) => term.trim())
          .filter(Boolean).length
      : 0,
  };
}

const toRecordingRequest = (
  normalized: NormalizedAudio,
  params: SpeechToTextRequest
): SpeechToTextRecordingRequest => {
  const { source: _source, ...rest } = params;
  return { ...normalized, ...rest };
};

export const makeWorkersAiSpeechToText = (primary: TranscribeService): SpeechToTextService => ({
  transcribeAudio: (params: SpeechToTextRequest) =>
    Effect.gen(function* () {
      const normalized = yield* normalizeAudioSource(params.source);
      return yield* transcribeRecording(primary, toRecordingRequest(normalized, params));
    }),
  transcribeRecording: (params) => transcribeRecording(primary, params),
});

const transcribeRecording = (primary: TranscribeService, params: SpeechToTextRecordingRequest) =>
  primary.transcribe(params).pipe(
    withRequestTimeout(
      () =>
        new TranscribeError({
          message: `STT request timed out after ${REQUEST_TIMEOUT_MS}ms`,
          retryable: true,
        })
    ),
    Effect.map((result) => enrichTranscriptionResult(result, params.audio)),
    Effect.tap((result) =>
      enrichWideEvent({
        sttResult: {
          ...describeTranscriptionInput(params),
          audioDurationSeconds: result.duration,
          durationAfterVadSeconds: result.durationAfterVad,
        },
      })
    ),
    Effect.mapError((e) => new SpeechToTextError({ message: e.message, retryable: e.retryable }))
  );

// gpt-4o-transcribe does not report audio duration. Recover it from the WAV
// bytes so usage/WPM have a real denominator regardless of the STT engine.
const enrichTranscriptionResult = (result: TranscribeResult, audio: ArrayBuffer) => {
  const duration = result.duration > 0 ? result.duration : wavDurationSeconds(audio);
  return {
    ...result,
    duration,
    textLength: result.text.length,
    wordCount: countWords(result.text),
    durationMs: Math.round(duration * 1000),
  };
};
