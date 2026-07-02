import { Effect } from "effect";
import { affiliateReward, affiliateReferral, eq, type DrizzleDatabase } from "@whisper/db";
import type { AffiliateBatchWriterService } from "../application/ports/affiliate-batch-writer";
import { AffiliateDatabaseError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";

const fail = (e: unknown) => new AffiliateDatabaseError({ message: unknownMessage(e) });

export const makeDrizzleAffiliateBatchWriter = (
  db: DrizzleDatabase
): AffiliateBatchWriterService => ({
  grantRewardWithReferralUpdate: ({ rewardId, rewardUpdate, referralId, referralUpdate }) =>
    Effect.tryPromise({
      try: async () => {
        await db.batch([
          db
            .update(affiliateReward)
            .set({
              status: rewardUpdate.status,
              grantedAt: rewardUpdate.grantedAt,
              updatedAt: rewardUpdate.updatedAt,
            })
            .where(eq(affiliateReward.id, rewardId)),
          db
            .update(affiliateReferral)
            .set({
              status: referralUpdate.status,
              rewardedAt: referralUpdate.rewardedAt,
              updatedAt: referralUpdate.updatedAt,
            })
            .where(eq(affiliateReferral.id, referralId)),
        ]);
      },
      catch: fail,
    }),
});
