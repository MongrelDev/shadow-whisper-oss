import { Effect } from "effect";
import { WarmupError } from "../errors";
import type {
  RegisterSessionInput,
  WhisperAgentSessionService,
} from "../application/ports/whisper-agent-session";

export const makeDOWhisperAgentSession = (env: Env): WhisperAgentSessionService => ({
  registerSession: (input: RegisterSessionInput) =>
    Effect.tryPromise({
      try: () =>
        env.WhisperAgent.getByName(input.userId).startSession({
          userId: input.userId,
          sessionId: input.sessionId,
          metadata: input.metadata,
          startedAt: input.startedAt,
        }),
      catch: (e) => new WarmupError({ message: `agent_register_failed: ${String(e)}` }),
    }),
});
