import { Effect, Option } from "effect";
import type {
  ActionAgentRunInput,
  ActionAgentRunnerService,
} from "../application/ports/action-agent-runner";
import { ActionModeExecutionError } from "../errors";

// Worker -> Agent edge, mirroring the transcription strategy adapter: the Worker
// stays the HTTP/security boundary and forwards the already-authorized call to
// the user's WhisperAgent over Durable Object RPC. Audio crosses as an
// ArrayBuffer; the agent never persists it.
export const makeAgentBackedActionRunner = (env: Env): ActionAgentRunnerService => ({
  run: Effect.fnUntraced(
    function* (input: ActionAgentRunInput) {
      const audio = yield* Effect.tryPromise({
        try: () => input.audio.arrayBuffer(),
        catch: (e) => new ActionModeExecutionError({ message: `audio_read_failed: ${String(e)}` }),
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

      return yield* Effect.tryPromise({
        try: () =>
          stub.runActionMode({
            userId: input.userId,
            audio,
            contentType: input.contentType,
            locale: input.locale,
            selectedText: input.selectedText,
            timezone: input.timezone,
            language: input.language,
            platform: input.platform,
            os: input.os,
            surfaceContext: input.surfaceContext,
            bundleId: input.bundleId,
            siteHost: input.siteHost,
            traceContext,
          }),
        catch: (e) => new ActionModeExecutionError({ message: String(e) }),
      });
    },
    (eff, input) =>
      eff.pipe(
        Effect.withSpan("action-mode.agent-rpc", {
          attributes: {
            "action_mode.userId": input.userId,
            "audio.contentType": input.contentType,
            "action_mode.hasSelectedText": input.selectedText !== null,
          },
        })
      )
  ),
});
