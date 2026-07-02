import { Context, Effect, Layer } from "effect";
import { UnauthorizedError } from "../../auth/application/current-user";
import type { RecordCompletionResult } from "../domain/transcription-piggyback";
import type { TranscriptionFailedError, WarmupError } from "../errors";
import { SessionRewardsSource } from "./ports/session-rewards-source";
import { SessionTokenSigner } from "./ports/session-token-signer";

export interface WaitForSessionRewardsInput {
  readonly userId: string;
  readonly sessionId: string;
}

const REWARDS_WAIT_CAP = "25 seconds";

export interface WhisperRewardsServiceShape {
  readonly waitForRewards: (
    input: WaitForSessionRewardsInput
  ) => Effect.Effect<
    RecordCompletionResult | null,
    UnauthorizedError | WarmupError | TranscriptionFailedError
  >;
}

export class WhisperRewardsService extends Context.Service<
  WhisperRewardsService,
  WhisperRewardsServiceShape
>()("WhisperRewardsService") {}

export const WhisperRewardsServiceLive = Layer.effect(
  WhisperRewardsService,
  Effect.gen(function* () {
    const signer = yield* SessionTokenSigner;
    const source = yield* SessionRewardsSource;

    return WhisperRewardsService.of({
      waitForRewards: Effect.fnUntraced(function* (input: WaitForSessionRewardsInput) {
        const verification = yield* signer.verify(input.sessionId, input.userId);
        if (!verification.ok) {
          return yield* new UnauthorizedError({ reason: `session_${verification.reason}` });
        }
        // The agent resolves as soon as evaluation lands; the race caps a stuck
        // evaluation so the events stream always terminates for the client.
        return yield* Effect.race(
          source.waitForRewards(input),
          Effect.succeed(null).pipe(Effect.delay(REWARDS_WAIT_CAP))
        );
      }),
    });
  })
);
