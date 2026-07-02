import { Context, type Effect } from "effect";
import type { RecordCompletionResult } from "../../domain/transcription-piggyback";
import type { TranscriptionFailedError } from "../../errors";

export interface WaitForRewardsInput {
  readonly userId: string;
  readonly sessionId: string;
}

export interface SessionRewardsSourceService {
  readonly waitForRewards: (
    input: WaitForRewardsInput
  ) => Effect.Effect<RecordCompletionResult | null, TranscriptionFailedError>;
}

export class SessionRewardsSource extends Context.Service<
  SessionRewardsSource,
  SessionRewardsSourceService
>()("SessionRewardsSource") {}
