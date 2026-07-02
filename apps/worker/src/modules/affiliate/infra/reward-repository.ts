import { Effect } from "effect";
import { affiliateReward, desc, eq, type DrizzleDatabase } from "@whisper/db";
import type { RewardRepositoryService } from "../application/ports/reward-repository";
import { nowIso } from "../domain/time";
import { AffiliateDatabaseError } from "../errors";
import { decodeAffiliateReward as toDomain } from "./persistence-mappers";
import { unknownMessage } from "../../../lib/unknown-message";

const fail = (e: unknown) => new AffiliateDatabaseError({ message: unknownMessage(e) });

export const makeDrizzleRewardRepository = (db: DrizzleDatabase): RewardRepositoryService => ({
  findByReferralId: (referralId) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .select()
          .from(affiliateReward)
          .where(eq(affiliateReward.referralId, referralId))
          .limit(1);
        return rows[0] ? toDomain(rows[0]) : null;
      },
      catch: fail,
    }),

  findByUserId: (userId, options) =>
    Effect.tryPromise({
      try: async () => {
        let query = db
          .select()
          .from(affiliateReward)
          .where(eq(affiliateReward.userId, userId))
          .orderBy(desc(affiliateReward.createdAt));
        if (options?.limit) query = query.limit(options.limit) as typeof query;
        const rows = await query;
        return rows.map((row) => toDomain(row));
      },
      catch: fail,
    }),

  create: (reward) =>
    Effect.tryPromise({
      try: async () => {
        const now = nowIso();
        const rows = await db
          .insert(affiliateReward)
          .values({
            referralId: reward.referralId,
            userId: reward.userId,
            type: reward.type,
            amountInCents: reward.amountInCents,
            currency: reward.currency,
            stripeCustomerId: reward.stripeCustomerId,
            stripeCreditId: reward.stripeCreditId,
            stripeInvoiceId: reward.stripeInvoiceId,
            stripeEventId: reward.stripeEventId,
            targetTrialEnd: reward.targetTrialEnd,
            status: reward.status,
            grantedAt: reward.grantedAt,
            consumedAt: reward.consumedAt,
            canceledAt: reward.canceledAt,
            cancelReason: reward.cancelReason,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        return toDomain(rows[0]!);
      },
      catch: fail,
    }),

  updateStatus: (id, update) =>
    Effect.tryPromise({
      try: async () => {
        await db
          .update(affiliateReward)
          .set({
            status: update.status,
            grantedAt: update.grantedAt,
            consumedAt: update.consumedAt,
            canceledAt: update.canceledAt,
            cancelReason: update.cancelReason,
            stripeCreditId: update.stripeCreditId,
            targetTrialEnd: update.targetTrialEnd,
            updatedAt: update.updatedAt,
          })
          .where(eq(affiliateReward.id, id));
      },
      catch: fail,
    }),

  findByStripeEventId: (stripeEventId) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .select()
          .from(affiliateReward)
          .where(eq(affiliateReward.stripeEventId, stripeEventId))
          .limit(1);
        return rows[0] ? toDomain(rows[0]) : null;
      },
      catch: fail,
    }),
});
