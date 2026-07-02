import { Effect } from "effect";
import type { SessionRewardsSourceService } from "../application/ports/session-rewards-source";
import { TranscriptionFailedError } from "../errors";

export const makeDOSessionRewardsSource = (env: Env): SessionRewardsSourceService => ({
  waitForRewards: (input) =>
    Effect.tryPromise({
      try: () =>
        env.WhisperAgent.getByName(input.userId).getRewards({
          userId: input.userId,
          sessionId: input.sessionId,
        }),
      catch: (e) => new TranscriptionFailedError({ message: `rewards_fetch_failed: ${String(e)}` }),
    }),
});
