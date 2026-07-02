import { env } from "cloudflare:workers";
import {
  affiliateProfile as affiliateProfileTable,
  affiliateReferral as affiliateReferralTable,
  affiliateReward as affiliateRewardTable,
  createDb,
  eq,
  subscription as subscriptionTable,
  user as userTable,
} from "@whisper/db";

const CORE_SCHEMA_STATEMENTS = [
  "CREATE TABLE IF NOT EXISTS `user` (`id` text PRIMARY KEY NOT NULL, `name` text NOT NULL, `email` text NOT NULL, `emailVerified` integer NOT NULL, `image` text, `createdAt` integer NOT NULL, `updatedAt` integer NOT NULL, `stripeCustomerId` text)",
  "CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (`email`)",
  "CREATE TABLE IF NOT EXISTS `session` (`id` text PRIMARY KEY NOT NULL, `expiresAt` integer NOT NULL, `token` text NOT NULL, `createdAt` integer NOT NULL, `updatedAt` integer NOT NULL, `ipAddress` text, `userAgent` text, `userId` text NOT NULL, FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade)",
  "CREATE UNIQUE INDEX IF NOT EXISTS `session_token_unique` ON `session` (`token`)",
  "CREATE INDEX IF NOT EXISTS `session_userId_idx` ON `session` (`userId`)",
  "CREATE TABLE IF NOT EXISTS `account` (`id` text PRIMARY KEY NOT NULL, `accountId` text NOT NULL, `providerId` text NOT NULL, `userId` text NOT NULL, `accessToken` text, `refreshToken` text, `idToken` text, `accessTokenExpiresAt` integer, `refreshTokenExpiresAt` integer, `scope` text, `password` text, `createdAt` integer NOT NULL, `updatedAt` integer NOT NULL, FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade)",
  "CREATE INDEX IF NOT EXISTS `account_userId_idx` ON `account` (`userId`)",
  "CREATE TABLE IF NOT EXISTS `verification` (`id` text PRIMARY KEY NOT NULL, `identifier` text NOT NULL, `value` text NOT NULL, `expiresAt` integer NOT NULL, `createdAt` integer NOT NULL, `updatedAt` integer NOT NULL)",
  "CREATE INDEX IF NOT EXISTS `verification_identifier_idx` ON `verification` (`identifier`)",
  "CREATE TABLE IF NOT EXISTS `jwks` (`id` text PRIMARY KEY NOT NULL, `publicKey` text NOT NULL, `privateKey` text NOT NULL, `createdAt` integer NOT NULL, `expiresAt` integer)",
  "CREATE TABLE IF NOT EXISTS `subscription` (`id` text PRIMARY KEY NOT NULL, `plan` text NOT NULL, `referenceId` text NOT NULL, `stripeCustomerId` text, `stripeSubscriptionId` text, `status` text NOT NULL, `periodStart` integer, `periodEnd` integer, `trialStart` integer, `trialEnd` integer, `cancelAtPeriodEnd` integer, `cancelAt` integer, `canceledAt` integer, `endedAt` integer, `seats` integer, `billingInterval` text, `stripeScheduleId` text)",
  "CREATE TABLE IF NOT EXISTS `affiliate_profile` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `userId` text NOT NULL, `code` text NOT NULL, `isActive` integer NOT NULL, `createdAt` text NOT NULL, `updatedAt` text NOT NULL, FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade)",
  "CREATE UNIQUE INDEX IF NOT EXISTS `affiliate_profile_userId_unique` ON `affiliate_profile` (`userId`)",
  "CREATE UNIQUE INDEX IF NOT EXISTS `affiliate_profile_code_unique` ON `affiliate_profile` (`code`)",
  "CREATE INDEX IF NOT EXISTS `affiliateProfile_userId_idx` ON `affiliate_profile` (`userId`)",
  "CREATE INDEX IF NOT EXISTS `affiliateProfile_code_idx` ON `affiliate_profile` (`code`)",
  "CREATE TABLE IF NOT EXISTS `affiliate_referral` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `referrerUserId` text NOT NULL, `referredUserId` text NOT NULL, `affiliateCode` text NOT NULL, `source` text NOT NULL, `status` text NOT NULL, `benefitType` text NOT NULL, `benefitStartedAt` text, `benefitEndsAt` text, `firstPaidInvoiceId` text, `firstPaidAt` text, `qualifiedAt` text, `rewardedAt` text, `rejectedAt` text, `rejectionReason` text, `createdAt` text NOT NULL, `updatedAt` text NOT NULL, FOREIGN KEY (`referrerUserId`) REFERENCES `user`(`id`), FOREIGN KEY (`referredUserId`) REFERENCES `user`(`id`))",
  "CREATE UNIQUE INDEX IF NOT EXISTS `affiliate_referral_referredUserId_unique` ON `affiliate_referral` (`referredUserId`)",
  "CREATE INDEX IF NOT EXISTS `affiliateReferral_referrerUserId_idx` ON `affiliate_referral` (`referrerUserId`)",
  "CREATE INDEX IF NOT EXISTS `affiliateReferral_affiliateCode_idx` ON `affiliate_referral` (`affiliateCode`)",
  "CREATE INDEX IF NOT EXISTS `affiliateReferral_status_idx` ON `affiliate_referral` (`status`)",
  "CREATE TABLE IF NOT EXISTS `affiliate_reward` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `referralId` integer NOT NULL, `userId` text NOT NULL, `type` text NOT NULL, `amountInCents` integer NOT NULL, `currency` text NOT NULL, `stripeCustomerId` text, `stripeCreditId` text, `stripeInvoiceId` text, `stripeEventId` text, `targetTrialEnd` integer, `status` text NOT NULL, `grantedAt` text, `consumedAt` text, `canceledAt` text, `cancelReason` text, `createdAt` text NOT NULL, `updatedAt` text NOT NULL, FOREIGN KEY (`referralId`) REFERENCES `affiliate_referral`(`id`), FOREIGN KEY (`userId`) REFERENCES `user`(`id`))",
  "CREATE UNIQUE INDEX IF NOT EXISTS `affiliate_reward_referralId_unique` ON `affiliate_reward` (`referralId`)",
  "CREATE UNIQUE INDEX IF NOT EXISTS `affiliateReward_stripeEventId_idx` ON `affiliate_reward` (`stripeEventId`)",
  "CREATE INDEX IF NOT EXISTS `affiliateReward_userId_idx` ON `affiliate_reward` (`userId`)",
  "CREATE INDEX IF NOT EXISTS `affiliateReward_status_idx` ON `affiliate_reward` (`status`)",
  "CREATE TABLE IF NOT EXISTS `demo_transcripts` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `workflow_id` text NOT NULL, `kind` text NOT NULL, `phase` text DEFAULT 'queued' NOT NULL, `surface_id` text, `skill_id` text, `raw_text` text, `clean_text` text, `duration_ms` integer, `audio_bytes` integer, `word_count` integer, `locale` text, `ip_hash` text NOT NULL, `error_message` text, `cancelled_at` integer, `phase_updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL, `created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL, `updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS `demo_transcripts_workflow_id_unique` ON `demo_transcripts` (`workflow_id`)",
  "CREATE INDEX IF NOT EXISTS `idx_demo_transcripts_created_at` ON `demo_transcripts` (`created_at`)",
  "CREATE INDEX IF NOT EXISTS `idx_demo_transcripts_ip_hash` ON `demo_transcripts` (`ip_hash`)",
  "CREATE TABLE IF NOT EXISTS `app_registry` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `platform` text DEFAULT 'macos' NOT NULL, `identifier` text NOT NULL, `host_name` text NOT NULL, `category` text NOT NULL, `created_at` integer NOT NULL, `updated_at` integer NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS `app_registry_platform_identifier_idx` ON `app_registry` (`platform`,`identifier`)",
  "CREATE INDEX IF NOT EXISTS `app_registry_category_idx` ON `app_registry` (`category`)",
  "CREATE TABLE IF NOT EXISTS `app_host_registry` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `host` text NOT NULL, `host_name` text NOT NULL, `category` text NOT NULL, `created_at` integer NOT NULL, `updated_at` integer NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS `app_host_registry_host_idx` ON `app_host_registry` (`host`)",
  "CREATE INDEX IF NOT EXISTS `app_host_registry_category_idx` ON `app_host_registry` (`category`)",
  "CREATE TABLE IF NOT EXISTS `app_registry_candidates` (`identifier` text PRIMARY KEY NOT NULL, `identifier_type` text NOT NULL, `occurrence_count` integer DEFAULT 1 NOT NULL, `last_seen_at` integer NOT NULL, `promoted_at` integer)",
  "CREATE INDEX IF NOT EXISTS `app_registry_candidates_count_idx` ON `app_registry_candidates` (`occurrence_count`)",
  "CREATE TABLE IF NOT EXISTS `app_variety_today` ( `user_id` text NOT NULL, `local_date` text NOT NULL, `identifier` text NOT NULL, PRIMARY KEY(`user_id`, `local_date`, `identifier`), FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade )",
  "CREATE TABLE IF NOT EXISTS `usage_entries` ( `id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL, `word_count` integer NOT NULL, `bundle_id` text, `site_host` text, `surface_context` text, `engines_json` text, `duration_ms` integer NOT NULL, `created_at` integer NOT NULL, `skill_id` text, `skill_version` integer, `input_word_count` integer, `output_word_count` integer, `success` integer DEFAULT 1 NOT NULL, `platform` text NOT NULL, `os` text NOT NULL, `language` text, `local_date` text NOT NULL, `local_hour` integer NOT NULL, `timezone` text NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade )",
  "CREATE INDEX IF NOT EXISTS `usage_entries_user_created_at_idx` ON `usage_entries` (`user_id`,`created_at`)",
  "CREATE INDEX IF NOT EXISTS `usage_entries_user_local_date_idx` ON `usage_entries` (`user_id`,`local_date`)",
  "CREATE TABLE IF NOT EXISTS `user_achievements` ( `user_id` text NOT NULL, `achievement_key` text NOT NULL, `earned_at` integer NOT NULL, `context_json` text, PRIMARY KEY(`user_id`, `achievement_key`), FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade )",
  "CREATE TABLE IF NOT EXISTS `user_summary` ( `user_id` text PRIMARY KEY NOT NULL, `total_words` integer DEFAULT 0 NOT NULL, `all_time_daily_best` integer DEFAULT 0 NOT NULL, `max_streak` integer DEFAULT 0 NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade )",
  "CREATE TABLE IF NOT EXISTS `custom_skills` ( `id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL, `slug` text NOT NULL, `display_name` text NOT NULL, `description` text DEFAULT '' NOT NULL, `markdown` text NOT NULL, `triggers` text DEFAULT '[]' NOT NULL, `created_at` integer NOT NULL, `updated_at` integer NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade )",
  "CREATE INDEX IF NOT EXISTS `custom_skills_user_idx` ON `custom_skills` (`user_id`)",
  "CREATE TABLE IF NOT EXISTS `dictionary_snippets` ( `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `user_id` text NOT NULL, `trigger_phrase` text NOT NULL, `expanded_text` text NOT NULL, `created_at` integer NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade )",
  "CREATE INDEX IF NOT EXISTS `dictionary_snippets_user_idx` ON `dictionary_snippets` (`user_id`)",
  "CREATE TABLE IF NOT EXISTS `dictionary_words` ( `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `user_id` text NOT NULL, `word` text NOT NULL, `created_at` integer NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade )",
  "CREATE INDEX IF NOT EXISTS `dictionary_words_user_idx` ON `dictionary_words` (`user_id`)",
  "CREATE TABLE IF NOT EXISTS `installed_skills` ( `user_id` text NOT NULL, `skill_id` text NOT NULL, `display_name` text NOT NULL, `description` text NOT NULL, `slug` text NOT NULL, `installed_at` integer NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade )",
  "CREATE UNIQUE INDEX IF NOT EXISTS `installed_skills_user_skill_idx` ON `installed_skills` (`user_id`,`skill_id`)",
  "CREATE TABLE IF NOT EXISTS `learned_words` ( `id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL, `source` text NOT NULL, `replacement` text NOT NULL, `source_lower` text NOT NULL, `context` text, `frequency` integer DEFAULT 1 NOT NULL, `last_used_at` integer NOT NULL, `created_at` integer NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade )",
  "CREATE UNIQUE INDEX IF NOT EXISTS `learned_words_user_source_lower_idx` ON `learned_words` (`user_id`,`source_lower`)",
  "CREATE TABLE IF NOT EXISTS `pending_suggestions` ( `id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL, `feedback_id` text NOT NULL, `original` text NOT NULL, `replacement` text NOT NULL, `context` text DEFAULT '' NOT NULL, `selected_text` text DEFAULT '' NOT NULL, `status` text DEFAULT 'pending' NOT NULL, `source` text DEFAULT 'teach' NOT NULL, `matched_session_id` text, `created_at` integer NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade )",
  "CREATE INDEX IF NOT EXISTS `pending_suggestions_user_status_idx` ON `pending_suggestions` (`user_id`,`status`)",
] as const;

const RESET_STATEMENTS = [
  "DELETE FROM `usage_entries`",
  "DELETE FROM `user_achievements`",
  "DELETE FROM `user_summary`",
  "DELETE FROM `app_variety_today`",
  "DELETE FROM `learned_words`",
  "DELETE FROM `dictionary_words`",
  "DELETE FROM `dictionary_snippets`",
  "DELETE FROM `installed_skills`",
  "DELETE FROM `custom_skills`",
  "DELETE FROM `pending_suggestions`",
  "DELETE FROM `app_registry_candidates`",
  "DELETE FROM `app_registry`",
  "DELETE FROM `app_host_registry`",
  "DELETE FROM `demo_transcripts`",
  "DELETE FROM `affiliate_reward`",
  "DELETE FROM `affiliate_referral`",
  "DELETE FROM `affiliate_profile`",
  "DELETE FROM `session`",
  "DELETE FROM `account`",
  "DELETE FROM `verification`",
  "DELETE FROM `jwks`",
  "DELETE FROM `subscription`",
  "DELETE FROM `user`",
] as const;

function makeTimestamp(value = Date.now()): Date {
  return new Date(value);
}

function mergeDefined<T extends Record<string, unknown>>(defaults: T, overrides: Partial<T>): T {
  return Object.fromEntries(
    Object.entries(defaults).map(([key, value]) => {
      const override = overrides[key as keyof T];
      return [key, override === undefined ? value : override];
    })
  ) as T;
}

export interface TestUserInput {
  id?: string;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  image?: string | null;
  stripeCustomerId?: string | null;
}

export interface TestSubscriptionInput {
  id?: string;
  referenceId: string;
  plan?: "free" | "pro";
  status?: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  trialStart?: Date | null;
  trialEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  cancelAt?: Date | null;
  canceledAt?: Date | null;
  endedAt?: Date | null;
  seats?: number | null;
  billingInterval?: string | null;
  stripeScheduleId?: string | null;
}

export interface TestAffiliateProfileInput {
  userId: string;
  code?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestAffiliateReferralInput {
  referrerUserId: string;
  referredUserId: string;
  affiliateCode: string;
  source?: "web_link";
  status?: "pending" | "qualified" | "rewarded" | "rejected";
  benefitType?: "extended_trial";
  benefitStartedAt?: string | null;
  benefitEndsAt?: string | null;
  firstPaidInvoiceId?: string | null;
  firstPaidAt?: string | null;
  qualifiedAt?: string | null;
  rewardedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestAffiliateRewardInput {
  referralId: number;
  userId: string;
  type?: "subscription_extension";
  amountInCents?: number;
  currency?: string;
  stripeCustomerId?: string | null;
  stripeCreditId?: string | null;
  stripeInvoiceId?: string | null;
  stripeEventId?: string | null;
  targetTrialEnd?: Date | null;
  status?: "pending" | "granted" | "consumed" | "canceled" | "failed";
  grantedAt?: string | null;
  consumedAt?: string | null;
  canceledAt?: string | null;
  cancelReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

async function ensureCoreTables(): Promise<void> {
  await env.DB.batch(CORE_SCHEMA_STATEMENTS.map((statement) => env.DB.prepare(statement)));
}

export async function resetCoreTables(): Promise<void> {
  await ensureCoreTables();
  await env.DB.batch(RESET_STATEMENTS.map((statement) => env.DB.prepare(statement)));
}

function buildTestUser(input: TestUserInput) {
  const now = makeTimestamp();

  return mergeDefined(
    {
      id: crypto.randomUUID(),
      name: "Test User",
      email: `user-${crypto.randomUUID()}@example.com`,
      emailVerified: true,
      image: null as string | null,
      createdAt: now,
      updatedAt: now,
      stripeCustomerId: null as string | null,
    },
    input
  );
}

function buildTestSubscription(input: TestSubscriptionInput) {
  const now = makeTimestamp();

  return mergeDefined(
    {
      id: crypto.randomUUID(),
      plan: "pro" as const,
      referenceId: input.referenceId,
      stripeCustomerId: "cus_test" as string | null,
      stripeSubscriptionId: "sub_test" as string | null,
      status: "active",
      periodStart: now as Date | null,
      periodEnd: makeTimestamp(Date.now() + 1000 * 60 * 60 * 24 * 30) as Date | null,
      trialStart: null as Date | null,
      trialEnd: null as Date | null,
      cancelAtPeriodEnd: false,
      cancelAt: null as Date | null,
      canceledAt: null as Date | null,
      endedAt: null as Date | null,
      seats: 1 as number | null,
      billingInterval: "monthly" as string | null,
      stripeScheduleId: null as string | null,
    },
    input
  );
}

function buildTestAffiliateReferral(input: TestAffiliateReferralInput) {
  const nowIso = new Date().toISOString();

  return mergeDefined(
    {
      referrerUserId: input.referrerUserId,
      referredUserId: input.referredUserId,
      affiliateCode: input.affiliateCode,
      source: "web_link" as const,
      status: "pending" as const,
      benefitType: "extended_trial" as const,
      benefitStartedAt: null as string | null,
      benefitEndsAt: null as string | null,
      firstPaidInvoiceId: null as string | null,
      firstPaidAt: null as string | null,
      qualifiedAt: null as string | null,
      rewardedAt: null as string | null,
      rejectedAt: null as string | null,
      rejectionReason: null as string | null,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    input
  );
}

function buildTestAffiliateReward(input: TestAffiliateRewardInput) {
  const nowIso = new Date().toISOString();

  return mergeDefined(
    {
      referralId: input.referralId,
      userId: input.userId,
      type: "subscription_extension" as const,
      amountInCents: 0,
      currency: "USD",
      stripeCustomerId: null as string | null,
      stripeCreditId: null as string | null,
      stripeInvoiceId: null as string | null,
      stripeEventId: null as string | null,
      targetTrialEnd: null as Date | null,
      status: "pending" as const,
      grantedAt: null as string | null,
      consumedAt: null as string | null,
      canceledAt: null as string | null,
      cancelReason: null as string | null,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    input
  );
}

export async function insertTestUser(input: TestUserInput = {}) {
  await ensureCoreTables();
  const db = createDb(env.DB);
  const user = buildTestUser(input);

  await db.insert(userTable).values(user);
  return user;
}

export async function insertTestSubscription(input: TestSubscriptionInput) {
  await ensureCoreTables();
  const db = createDb(env.DB);
  const subscription = buildTestSubscription(input);

  await db.insert(subscriptionTable).values(subscription);
  return subscription;
}

export async function insertTestAffiliateProfile(input: TestAffiliateProfileInput) {
  await ensureCoreTables();
  const db = createDb(env.DB);
  const nowIso = new Date().toISOString();

  const rows = await db
    .insert(affiliateProfileTable)
    .values({
      userId: input.userId,
      code: input.code ?? crypto.randomUUID().replace(/-/g, "").slice(0, 8).toLowerCase(),
      isActive: input.isActive ?? true,
      createdAt: input.createdAt ?? nowIso,
      updatedAt: input.updatedAt ?? nowIso,
    })
    .returning();

  return rows[0]!;
}

export async function insertTestAffiliateReferral(input: TestAffiliateReferralInput) {
  await ensureCoreTables();
  const db = createDb(env.DB);

  const rows = await db
    .insert(affiliateReferralTable)
    .values(buildTestAffiliateReferral(input))
    .returning();

  return rows[0]!;
}

export async function insertTestAffiliateReward(input: TestAffiliateRewardInput) {
  await ensureCoreTables();
  const db = createDb(env.DB);

  const rows = await db
    .insert(affiliateRewardTable)
    .values(buildTestAffiliateReward(input))
    .returning();

  return rows[0]!;
}

export async function findUserByEmail(email: string) {
  await ensureCoreTables();
  const db = createDb(env.DB);

  return db.select().from(userTable).where(eq(userTable.email, email.trim().toLowerCase())).get();
}

export async function findAffiliateProfileByUserId(userId: string) {
  await ensureCoreTables();
  const db = createDb(env.DB);

  return db
    .select()
    .from(affiliateProfileTable)
    .where(eq(affiliateProfileTable.userId, userId))
    .get();
}

export async function findAffiliateReferralByReferredUserId(userId: string) {
  await ensureCoreTables();
  const db = createDb(env.DB);

  return db
    .select()
    .from(affiliateReferralTable)
    .where(eq(affiliateReferralTable.referredUserId, userId))
    .get();
}

export async function setUserEmailVerified(email: string, emailVerified = true) {
  await ensureCoreTables();
  const db = createDb(env.DB);

  await db
    .update(userTable)
    .set({
      emailVerified,
      updatedAt: makeTimestamp(),
    })
    .where(eq(userTable.email, email.trim().toLowerCase()));
}

export interface TestAppRegistryInput {
  identifier: string;
  identifierType: "bundle" | "host";
  hostName: string;
  category: string;
  platform?: string;
}

export async function seedAppRegistryEntry(input: TestAppRegistryInput) {
  await ensureCoreTables();
  const now = Date.now();
  if (input.identifierType === "host") {
    await env.DB.prepare(
      "INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(input.identifier, input.hostName, input.category, now, now)
      .run();
    return;
  }
  await env.DB.prepare(
    "INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(input.platform ?? "macos", input.identifier, input.hostName, input.category, now, now)
    .run();
}
