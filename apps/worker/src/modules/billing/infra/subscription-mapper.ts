import { Schema, SchemaTransformation } from "effect";
import type { Plan } from "../schemas";

// ─── Current Subscription (access control queries) ──────────────────

class CurrentSubscriptionRow extends Schema.Class<CurrentSubscriptionRow>("CurrentSubscriptionRow")(
  {
    plan: Schema.String,
    status: Schema.String,
    trialEnd: Schema.NullOr(Schema.Date),
    currentPeriodEnd: Schema.NullOr(Schema.Date),
  }
) {}

export class CurrentSubscriptionRecord extends Schema.Class<CurrentSubscriptionRecord>(
  "CurrentSubscriptionRecord"
)({
  plan: Schema.Literals(["free", "pro", "byok"]),
  status: Schema.Literals(["active", "trialing"]),
  trialEnd: Schema.NullOr(Schema.Number),
  currentPeriodEnd: Schema.NullOr(Schema.Number),
}) {}

const CurrentSubscriptionFromRow = CurrentSubscriptionRow.pipe(
  Schema.decodeTo(
    CurrentSubscriptionRecord,
    SchemaTransformation.transform({
      decode: (row) => ({
        plan: row.plan as Plan,
        status: row.status as "active" | "trialing",
        trialEnd: row.trialEnd ? Math.floor(row.trialEnd.getTime() / 1000) : null,
        currentPeriodEnd: row.currentPeriodEnd
          ? Math.floor(row.currentPeriodEnd.getTime() / 1000)
          : null,
      }),
      encode: (record) => ({
        plan: record.plan,
        status: record.status,
        trialEnd: record.trialEnd ? new Date(record.trialEnd * 1000) : null,
        currentPeriodEnd: record.currentPeriodEnd ? new Date(record.currentPeriodEnd * 1000) : null,
      }),
    })
  )
);

export const NullableCurrentSubscriptionFromRow = Schema.UndefinedOr(CurrentSubscriptionRow).pipe(
  Schema.decodeTo(
    Schema.NullOr(CurrentSubscriptionRecord),
    SchemaTransformation.transform({
      decode: (row) => {
        if (!row || row.plan !== "pro") return null;
        return Schema.decodeUnknownSync(CurrentSubscriptionFromRow)(row);
      },
      encode: (record) => {
        if (!record) return undefined;
        return Schema.encodeUnknownSync(CurrentSubscriptionFromRow)(
          record
        ) as typeof CurrentSubscriptionRow.Type;
      },
    })
  )
);

// ─── Latest Subscription (display queries) ──────────────────────────

class LatestSubscriptionRow extends Schema.Class<LatestSubscriptionRow>("LatestSubscriptionRow")({
  plan: Schema.String,
  status: Schema.String,
  trialEnd: Schema.NullOr(Schema.Date),
  currentPeriodEnd: Schema.NullOr(Schema.Date),
  cancelAtPeriodEnd: Schema.NullOr(Schema.Boolean),
  canceledAt: Schema.NullOr(Schema.Date),
}) {}

export class LatestSubscriptionRecord extends Schema.Class<LatestSubscriptionRecord>(
  "LatestSubscriptionRecord"
)({
  plan: Schema.Literals(["free", "pro", "byok"]),
  status: Schema.String,
  trialEnd: Schema.NullOr(Schema.Number),
  currentPeriodEnd: Schema.NullOr(Schema.Number),
  cancelAtPeriodEnd: Schema.Boolean,
  canceledAt: Schema.NullOr(Schema.Number),
}) {}

const LatestSubscriptionFromRow = LatestSubscriptionRow.pipe(
  Schema.decodeTo(
    LatestSubscriptionRecord,
    SchemaTransformation.transform({
      decode: (row) => ({
        plan: row.plan as Plan,
        status: row.status,
        trialEnd: row.trialEnd ? Math.floor(row.trialEnd.getTime() / 1000) : null,
        currentPeriodEnd: row.currentPeriodEnd
          ? Math.floor(row.currentPeriodEnd.getTime() / 1000)
          : null,
        cancelAtPeriodEnd: row.cancelAtPeriodEnd ?? false,
        canceledAt: row.canceledAt ? Math.floor(row.canceledAt.getTime() / 1000) : null,
      }),
      encode: (record) => ({
        plan: record.plan,
        status: record.status,
        trialEnd: record.trialEnd ? new Date(record.trialEnd * 1000) : null,
        currentPeriodEnd: record.currentPeriodEnd ? new Date(record.currentPeriodEnd * 1000) : null,
        cancelAtPeriodEnd: record.cancelAtPeriodEnd,
        canceledAt: record.canceledAt ? new Date(record.canceledAt * 1000) : null,
      }),
    })
  )
);

export const NullableLatestSubscriptionFromRow = Schema.UndefinedOr(LatestSubscriptionRow).pipe(
  Schema.decodeTo(
    Schema.NullOr(LatestSubscriptionRecord),
    SchemaTransformation.transform({
      decode: (row) => {
        if (!row) return null;
        return Schema.decodeUnknownSync(LatestSubscriptionFromRow)(row);
      },
      encode: (record) => {
        if (!record) return undefined;
        return Schema.encodeUnknownSync(LatestSubscriptionFromRow)(
          record
        ) as typeof LatestSubscriptionRow.Type;
      },
    })
  )
);
