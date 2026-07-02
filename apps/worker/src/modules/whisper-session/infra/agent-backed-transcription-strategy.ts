import { Effect, Option } from "effect";
import type {
  TranscriptionInput,
  TranscriptionOutcome,
  TranscriptionStrategyService,
} from "../application/ports/transcription-strategy";
import { TranscriptionFailedError } from "../errors";

// Worker -> Agent edge. The Worker stays the HTTP/security boundary; this adapter
// forwards the already-authorized session to the user's WhisperAgent over Durable
// Object RPC. Audio crosses as an ArrayBuffer; the agent never persists it.
export const makeAgentBackedTranscriptionStrategy = (env: Env): TranscriptionStrategyService => ({
  run: (input: TranscriptionInput) =>
    Effect.gen(function* () {
      const audio = yield* Effect.tryPromise({
        try: () => input.audio.arrayBuffer(),
        catch: (e) => new TranscriptionFailedError({ message: `audio_read_failed: ${String(e)}` }),
      });

      const stub = env.WhisperAgent.getByName(input.userId);

      const spanOption = yield* Effect.currentSpan.pipe(Effect.option);
      const traceContext = Option.match(spanOption, {
        onNone: () => undefined,
        onSome: (span) => ({
          traceId: span.traceId,
          spanId: span.spanId,
          sampled: span.sampled,
        }),
      });

      const result = yield* Effect.tryPromise({
        try: () =>
          stub.runSession({
            userId: input.userId,
            sessionId: input.sessionId,
            audio,
            contentType: input.contentType,
            locale: input.locale,
            skillMarkdown: input._tag === "ForcedSkill" ? input.skillMarkdown : null,
            timezone: input.timezone,
            language: input.language,
            platform: input.platform,
            os: input.os,
            surfaceContext: input.surfaceContext,
            traceContext,
          }),
        catch: (e) => new TranscriptionFailedError({ message: String(e) }),
      });

      return {
        sessionId: input.sessionId,
        workflowInstanceId: null,
        result: {
          kind: "inline",
          rawText: result.rawText,
          improvedText: result.improvedText,
          sttEngine: result.sttEngine,
          durationMs: result.durationMs,
        },
      } satisfies TranscriptionOutcome;
    }).pipe(
      Effect.withSpan("transcription.agent-rpc", {
        attributes: {
          "session.userId": input.userId,
          "session.mode": input._tag,
          "audio.contentType": input.contentType,
        },
      })
    ),
});
