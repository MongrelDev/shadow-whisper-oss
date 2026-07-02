import { Effect } from "effect";
import {
  affiliateReferral,
  affiliateReward,
  and,
  desc,
  eq,
  sql,
  user,
  type DrizzleDatabase,
} from "@whisper/db";
import type { ReferralRepositoryService } from "../application/ports/referral-repository";
import type { ReferralWithDetails } from "../application/ports/referral-repository";
import { AffiliateDatabaseError } from "../errors";
import { decodeAffiliateReferral, affiliateReferralToInsert } from "./persistence-mappers";
import { unknownMessage } from "../../../lib/unknown-message";

const fail = (e: unknown) => new AffiliateDatabaseError({ message: unknownMessage(e) });

export const makeDrizzleReferralRepository = (db: DrizzleDatabase): ReferralRepositoryService => ({
  findByReferredUserId: (userId) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .select()
          .from(affiliateReferral)
          .where(eq(affiliateReferral.referredUserId, userId))
          .limit(1);
        return rows[0] ? decodeAffiliateReferral(rows[0]) : null;
      },
      catch: fail,
    }),

  findPendingByReferredUserId: (userId) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .select()
          .from(affiliateReferral)
          .where(
            and(
              eq(affiliateReferral.referredUserId, userId),
              eq(affiliateReferral.status, "pending")
            )
          )
          .limit(1);
        return rows[0] ? decodeAffiliateReferral(rows[0]) : null;
      },
      catch: fail,
    }),

  findByReferrerUserId: (userId, options) =>
    Effect.tryPromise({
      try: async () => {
        let query = db
          .select()
          .from(affiliateReferral)
          .where(eq(affiliateReferral.referrerUserId, userId))
          .orderBy(desc(affiliateReferral.createdAt));
        if (options?.limit) query = query.limit(options.limit) as typeof query;
        const rows = await query;
        return rows.map((row) => decodeAffiliateReferral(row));
      },
      catch: fail,
    }),

  create: (referral) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .insert(affiliateReferral)
          .values(affiliateReferralToInsert(referral))
          .returning();
        return decodeAffiliateReferral(rows[0]!);
      },
      catch: fail,
    }),

  updateStatus: (id, update) =>
    Effect.tryPromise({
      try: async () => {
        await db
          .update(affiliateReferral)
          .set({
            status: update.status,
            qualifiedAt: update.qualifiedAt,
            rewardedAt: update.rewardedAt,
            rejectedAt: update.rejectedAt,
            rejectionReason: update.rejectionReason,
            firstPaidInvoiceId: update.firstPaidInvoiceId,
            firstPaidAt: update.firstPaidAt,
            updatedAt: update.updatedAt,
          })
          .where(eq(affiliateReferral.id, id));
      },
      catch: fail,
    }),

  countByReferrerUserId: (userId) =>
    Effect.tryPromise({
      // eslint-disable-next-line complexity
      try: async () => {
        const rows = await db
          .select({
            total: sql<number>`count(*)`,
            qualified: sql<number>`sum(case when ${affiliateReferral.status} = 'qualified' then 1 else 0 end)`,
            rewarded: sql<number>`sum(case when ${affiliateReferral.status} = 'rewarded' then 1 else 0 end)`,
          })
          .from(affiliateReferral)
          .where(eq(affiliateReferral.referrerUserId, userId));
        const row = rows[0];
        return {
          total: row?.total ?? 0,
          qualified: row?.qualified ?? 0,
          rewarded: row?.rewarded ?? 0,
        };
      },
      catch: fail,
    }),

  findByReferrerUserIdWithDetails: (userId, options) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .select({
            referredEmail: user.email,
            referredName: user.name,
            status: affiliateReferral.status,
            createdAt: affiliateReferral.createdAt,
            qualifiedAt: affiliateReferral.qualifiedAt,
            rewardedAt: affiliateReferral.rewardedAt,
            rewardDays: affiliateReward.type,
            rewardStatus: affiliateReward.status,
          })
          .from(affiliateReferral)
          .innerJoin(user, eq(affiliateReferral.referredUserId, user.id))
          .leftJoin(affiliateReward, eq(affiliateReferral.id, affiliateReward.referralId))
          .where(eq(affiliateReferral.referrerUserId, userId))
          .limit(options?.limit ?? 100)
          .orderBy(desc(affiliateReferral.createdAt));

        return rows.map(
          (row): ReferralWithDetails => ({
            referredEmail: row.referredEmail,
            referredName: row.referredName,
            status: row.status as ReferralWithDetails["status"],
            createdAt: row.createdAt,
            qualifiedAt: row.qualifiedAt,
            rewardedAt: row.rewardedAt,
            rewardGranted: row.rewardStatus === "granted" || row.rewardStatus === "consumed",
          })
        );
      },
      catch: fail,
    }),
});
