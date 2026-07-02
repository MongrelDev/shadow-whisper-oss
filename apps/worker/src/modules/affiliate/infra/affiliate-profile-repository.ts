import { Effect } from "effect";
import { affiliateProfile, eq, type DrizzleDatabase } from "@whisper/db";
import type { AffiliateProfileRepositoryService } from "../application/ports/affiliate-profile-repository";
import { nowIso } from "../domain/time";
import { AffiliateDatabaseError } from "../errors";
import { decodeAffiliateProfile as toDomain } from "./persistence-mappers";
import { unknownMessage } from "../../../lib/unknown-message";

const fail = (e: unknown) => new AffiliateDatabaseError({ message: unknownMessage(e) });

export const makeDrizzleAffiliateProfileRepository = (
  db: DrizzleDatabase
): AffiliateProfileRepositoryService => ({
  findByUserId: (userId) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .select()
          .from(affiliateProfile)
          .where(eq(affiliateProfile.userId, userId))
          .limit(1);
        return rows[0] ? toDomain(rows[0]) : null;
      },
      catch: fail,
    }),

  findByCode: (code) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .select()
          .from(affiliateProfile)
          .where(eq(affiliateProfile.code, code))
          .limit(1);
        const row = rows[0];
        if (!row || !row.isActive) return null;
        return toDomain(row);
      },
      catch: fail,
    }),

  create: (profile) =>
    Effect.tryPromise({
      try: async () => {
        const now = nowIso();
        const rows = await db
          .insert(affiliateProfile)
          .values({
            userId: profile.userId,
            code: profile.code,
            isActive: profile.isActive,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        return toDomain(rows[0]!);
      },
      catch: fail,
    }),

  updateActiveByUserId: (userId, isActive, updatedAt) =>
    Effect.tryPromise({
      try: async () => {
        await db
          .update(affiliateProfile)
          .set({ isActive, updatedAt })
          .where(eq(affiliateProfile.userId, userId));
      },
      catch: fail,
    }),

  codeExists: (code) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .select({ id: affiliateProfile.id })
          .from(affiliateProfile)
          .where(eq(affiliateProfile.code, code))
          .limit(1);
        return rows.length > 0;
      },
      catch: fail,
    }),
});
