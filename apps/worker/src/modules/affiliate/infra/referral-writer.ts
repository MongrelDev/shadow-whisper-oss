import { Effect } from "effect";
import { affiliateReferral, type DrizzleDatabase } from "@whisper/db";
import type { ReferralWriterService } from "../application/ports/referral-writer";
import { AffiliateDatabaseError, DuplicateReferralError } from "../errors";
import { decodeAffiliateReferral, affiliateReferralToInsert } from "./persistence-mappers";
import { unknownMessage } from "../../../lib/unknown-message";

export const makeDrizzleReferralWriter = (db: DrizzleDatabase): ReferralWriterService => ({
  createReferral: (input) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .insert(affiliateReferral)
          .values(affiliateReferralToInsert(input.referral))
          .returning();

        return {
          referral: decodeAffiliateReferral(rows[0]!),
        };
      },
      catch: (e) => {
        const msg = unknownMessage(e);
        if (msg.includes("UNIQUE constraint") || msg.includes("SQLITE_CONSTRAINT")) {
          return new DuplicateReferralError({
            referredUserId: input.referral.referredUserId,
          });
        }
        return new AffiliateDatabaseError({ message: msg });
      },
    }),
});
