import { Effect, type Schedule } from "effect";
import type {
  SpeechToTextRecordingRequest,
  SpeechToTextRequest,
  SpeechToTextService,
} from "../application/ports/speech-to-text";
import { enrichWideEvent } from "../../../observability/enrich-wide-event";

// Per-engine retry. Applied to each engine *before* the fallback combinator so
// a transient failure retries the same engine instead of bouncing to the other.
export const withSttRetry = (
  service: SpeechToTextService,
  schedule: Schedule.Schedule<unknown, unknown>
): SpeechToTextService => ({
  transcribeAudio: (params: SpeechToTextRequest) =>
    service
      .transcribeAudio(params)
      .pipe(Effect.retry({ schedule, while: (e) => e.retryable !== false })),
  transcribeRecording: (params: SpeechToTextRecordingRequest) =>
    service
      .transcribeRecording(params)
      .pipe(Effect.retry({ schedule, while: (e) => e.retryable !== false })),
});

const withRole = <T extends { gatewayMetadata?: Readonly<Record<string, string>> }>(
  params: T,
  role: "primary" | "fallback"
): T =>
  params.gatewayMetadata
    ? { ...params, gatewayMetadata: { ...params.gatewayMetadata, role } }
    : params;

export const makeFallbackSpeechToText = (
  primary: SpeechToTextService,
  fallback: SpeechToTextService
): SpeechToTextService => ({
  transcribeAudio: (params: SpeechToTextRequest) =>
    primary
      .transcribeAudio(withRole(params, "primary"))
      .pipe(
        Effect.catch((error) =>
          error.retryable === false
            ? Effect.fail(error)
            : enrichWideEvent({ stt: { fellBack: true, primaryError: error.message } }).pipe(
                Effect.andThen(fallback.transcribeAudio(withRole(params, "fallback")))
              )
        )
      ),
  transcribeRecording: (params: SpeechToTextRecordingRequest) =>
    primary
      .transcribeRecording(withRole(params, "primary"))
      .pipe(
        Effect.catch((error) =>
          error.retryable === false
            ? Effect.fail(error)
            : enrichWideEvent({ stt: { fellBack: true, primaryError: error.message } }).pipe(
                Effect.andThen(fallback.transcribeRecording(withRole(params, "fallback")))
              )
        )
      ),
});
