import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const affiliateProfile = sqliteTable(
  "affiliate_profile",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    code: text("code").notNull().unique(),
    isActive: integer("isActive", { mode: "boolean" }).notNull(),
    createdAt: text("createdAt").notNull(),
    updatedAt: text("updatedAt").notNull(),
  },
  (table) => [
    index("affiliateProfile_userId_idx").on(table.userId),
    index("affiliateProfile_code_idx").on(table.code),
  ]
);

export const affiliateReferral = sqliteTable(
  "affiliate_referral",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    referrerUserId: text("referrerUserId")
      .notNull()
      .references(() => user.id),
    referredUserId: text("referredUserId")
      .notNull()
      .unique()
      .references(() => user.id),
    affiliateCode: text("affiliateCode").notNull(),
    source: text("source").notNull(),
    status: text("status").notNull(),
    benefitType: text("benefitType").notNull(),
    benefitStartedAt: text("benefitStartedAt"),
    benefitEndsAt: text("benefitEndsAt"),
    firstPaidInvoiceId: text("firstPaidInvoiceId"),
    firstPaidAt: text("firstPaidAt"),
    qualifiedAt: text("qualifiedAt"),
    rewardedAt: text("rewardedAt"),
    rejectedAt: text("rejectedAt"),
    rejectionReason: text("rejectionReason"),
    createdAt: text("createdAt").notNull(),
    updatedAt: text("updatedAt").notNull(),
  },
  (table) => [
    index("affiliateReferral_referrerUserId_idx").on(table.referrerUserId),
    index("affiliateReferral_affiliateCode_idx").on(table.affiliateCode),
    index("affiliateReferral_status_idx").on(table.status),
  ]
);

export const affiliateReward = sqliteTable(
  "affiliate_reward",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    referralId: integer("referralId")
      .notNull()
      .unique()
      .references(() => affiliateReferral.id),
    userId: text("userId")
      .notNull()
      .references(() => user.id),
    type: text("type").notNull(),
    amountInCents: integer("amountInCents").notNull(),
    currency: text("currency").notNull(),
    stripeCustomerId: text("stripeCustomerId"),
    stripeCreditId: text("stripeCreditId"),
    stripeInvoiceId: text("stripeInvoiceId"),
    stripeEventId: text("stripeEventId"),
    targetTrialEnd: integer("targetTrialEnd"),
    status: text("status").notNull(),
    grantedAt: text("grantedAt"),
    consumedAt: text("consumedAt"),
    canceledAt: text("canceledAt"),
    cancelReason: text("cancelReason"),
    createdAt: text("createdAt").notNull(),
    updatedAt: text("updatedAt").notNull(),
  },
  (table) => [
    index("affiliateReward_userId_idx").on(table.userId),
    index("affiliateReward_status_idx").on(table.status),
    uniqueIndex("affiliateReward_stripeEventId_idx").on(table.stripeEventId),
  ]
);
