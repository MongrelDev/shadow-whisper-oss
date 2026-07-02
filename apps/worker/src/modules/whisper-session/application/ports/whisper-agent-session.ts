import { Context, Effect } from "effect";
import type { WarmupMetadata } from "../../domain/warmup-metadata";
import type { WarmupError } from "../../errors";

export interface RegisterSessionInput {
  readonly userId: string;
  readonly sessionId: string;
  readonly metadata: WarmupMetadata;
  readonly startedAt: number;
}

export interface WhisperAgentSessionService {
  readonly registerSession: (input: RegisterSessionInput) => Effect.Effect<void, WarmupError>;
}

export class WhisperAgentSession extends Context.Service<
  WhisperAgentSession,
  WhisperAgentSessionService
>()("WhisperAgentSession") {}
