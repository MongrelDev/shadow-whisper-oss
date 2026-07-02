import { Effect } from "effect";
import { user, subscription, and, eq, desc, inArray, type DrizzleDatabase } from "@whisper/db";
import type { UserReaderService } from "../application/ports/user-reader";
import { AffiliateDatabaseError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";

const fail = (e: unknown) => new AffiliateDatabaseError({ message: unknownMessage(e) });

export const makeDrizzleUserReader = (db: DrizzleDatabase): UserReaderService => ({
  getEmailByUserId: (userId) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .select({ email: user.email })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1);
        return rows[0]?.email ?? null;
      },
      catch: fail,
    }),

  getUserIdByEmail: (email) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.email, email))
          .limit(1);
        return rows[0]?.id ?? null;
      },
      catch: fail,
    }),

  getBillingProfile: (userId) =>
    Effect.tryPromise({
      try: async () => {
        const [userRow, subRow] = await Promise.all([
          db
            .select({ stripeCustomerId: user.stripeCustomerId })
            .from(user)
            .where(eq(user.id, userId))
            .limit(1),
          db
            .select({ stripeSubscriptionId: subscription.stripeSubscriptionId })
            .from(subscription)
            .where(
              and(
                eq(subscription.referenceId, userId),
                inArray(subscription.status, ["active", "trialing"])
              )
            )
            .orderBy(desc(subscription.periodEnd))
            .limit(1),
        ]);
        return {
          stripeCustomerId: userRow[0]?.stripeCustomerId ?? null,
          stripeSubscriptionId: subRow[0]?.stripeSubscriptionId ?? null,
        };
      },
      catch: fail,
    }),

  getUserIdByStripeCustomerId: (stripeCustomerId) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.stripeCustomerId, stripeCustomerId))
          .limit(1);
        return rows[0]?.id ?? null;
      },
      catch: fail,
    }),
});
