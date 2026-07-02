import { Effect, Schema } from "effect";
import {
  and,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  or,
  subscription,
  type DrizzleDatabase,
} from "@whisper/db";
import type { SubscriptionRepositoryService } from "../application/ports/subscription-repository";
import { BillingDatabaseError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";
import {
  NullableCurrentSubscriptionFromRow,
  NullableLatestSubscriptionFromRow,
} from "./subscription-mapper";

const decodeCurrentRow = Schema.decodeUnknownSync(NullableCurrentSubscriptionFromRow);
const decodeLatestRow = Schema.decodeUnknownSync(NullableLatestSubscriptionFromRow);

export const makeDrizzleSubscriptionRepository = (
  db: DrizzleDatabase
): SubscriptionRepositoryService => ({
  findCurrentByReferenceId: (referenceId) =>
    Effect.gen(function* () {
      const now = new Date();

      const rows = yield* Effect.tryPromise({
        try: () =>
          db
            .select({
              plan: subscription.plan,
              status: subscription.status,
              trialEnd: subscription.trialEnd,
              currentPeriodEnd: subscription.periodEnd,
            })
            .from(subscription)
            .where(
              and(
                eq(subscription.referenceId, referenceId),
                inArray(subscription.status, ["active", "trialing"]),
                or(isNull(subscription.trialEnd), gt(subscription.trialEnd, now))
              )
            )
            .limit(1),
        catch: (e) => new BillingDatabaseError({ message: unknownMessage(e) }),
      });

      return decodeCurrentRow(rows[0]);
    }),

  findLatestByReferenceId: (referenceId) =>
    Effect.gen(function* () {
      const rows = yield* Effect.tryPromise({
        try: () =>
          db
            .select({
              plan: subscription.plan,
              status: subscription.status,
              trialEnd: subscription.trialEnd,
              currentPeriodEnd: subscription.periodEnd,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              canceledAt: subscription.canceledAt,
            })
            .from(subscription)
            .where(eq(subscription.referenceId, referenceId))
            .orderBy(desc(subscription.periodEnd))
            .limit(1),
        catch: (e) => new BillingDatabaseError({ message: unknownMessage(e) }),
      });

      return decodeLatestRow(rows[0]);
    }),
});
