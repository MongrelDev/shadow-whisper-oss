CREATE TABLE `affiliate_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`code` text NOT NULL,
	`isActive` integer NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `affiliate_profile_userId_unique` ON `affiliate_profile` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `affiliate_profile_code_unique` ON `affiliate_profile` (`code`);--> statement-breakpoint
CREATE INDEX `affiliateProfile_userId_idx` ON `affiliate_profile` (`userId`);--> statement-breakpoint
CREATE INDEX `affiliateProfile_code_idx` ON `affiliate_profile` (`code`);--> statement-breakpoint
CREATE TABLE `affiliate_referral` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`referrerUserId` text NOT NULL,
	`referredUserId` text NOT NULL,
	`affiliateCode` text NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`benefitType` text NOT NULL,
	`benefitStartedAt` text,
	`benefitEndsAt` text,
	`firstPaidInvoiceId` text,
	`firstPaidAt` text,
	`qualifiedAt` text,
	`rewardedAt` text,
	`rejectedAt` text,
	`rejectionReason` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`referrerUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referredUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `affiliate_referral_referredUserId_unique` ON `affiliate_referral` (`referredUserId`);--> statement-breakpoint
CREATE INDEX `affiliateReferral_referrerUserId_idx` ON `affiliate_referral` (`referrerUserId`);--> statement-breakpoint
CREATE INDEX `affiliateReferral_affiliateCode_idx` ON `affiliate_referral` (`affiliateCode`);--> statement-breakpoint
CREATE INDEX `affiliateReferral_status_idx` ON `affiliate_referral` (`status`);--> statement-breakpoint
CREATE TABLE `affiliate_reward` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`referralId` integer NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`amountInCents` integer NOT NULL,
	`currency` text NOT NULL,
	`stripeCustomerId` text,
	`stripeCreditId` text,
	`stripeInvoiceId` text,
	`stripeEventId` text,
	`targetTrialEnd` integer,
	`status` text NOT NULL,
	`grantedAt` text,
	`consumedAt` text,
	`canceledAt` text,
	`cancelReason` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`referralId`) REFERENCES `affiliate_referral`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `affiliate_reward_referralId_unique` ON `affiliate_reward` (`referralId`);--> statement-breakpoint
CREATE INDEX `affiliateReward_userId_idx` ON `affiliate_reward` (`userId`);--> statement-breakpoint
CREATE INDEX `affiliateReward_status_idx` ON `affiliate_reward` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `affiliateReward_stripeEventId_idx` ON `affiliate_reward` (`stripeEventId`);--> statement-breakpoint
CREATE TABLE `app_registry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platform` text DEFAULT 'macos' NOT NULL,
	`identifier` text NOT NULL,
	`host_name` text NOT NULL,
	`category` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_registry_platform_identifier_idx` ON `app_registry` (`platform`,`identifier`);--> statement-breakpoint
CREATE INDEX `app_registry_category_idx` ON `app_registry` (`category`);--> statement-breakpoint
CREATE TABLE `app_host_registry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`host` text NOT NULL,
	`host_name` text NOT NULL,
	`category` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_host_registry_host_idx` ON `app_host_registry` (`host`);--> statement-breakpoint
CREATE INDEX `app_host_registry_category_idx` ON `app_host_registry` (`category`);--> statement-breakpoint
CREATE TABLE `app_registry_candidates` (
	`identifier` text PRIMARY KEY NOT NULL,
	`identifier_type` text NOT NULL,
	`occurrence_count` integer DEFAULT 1 NOT NULL,
	`last_seen_at` integer NOT NULL,
	`promoted_at` integer
);
--> statement-breakpoint
CREATE INDEX `app_registry_candidates_count_idx` ON `app_registry_candidates` (`occurrence_count`);--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`userId`);--> statement-breakpoint
CREATE TABLE `jwks` (
	`id` text PRIMARY KEY NOT NULL,
	`publicKey` text NOT NULL,
	`privateKey` text NOT NULL,
	`createdAt` integer NOT NULL,
	`expiresAt` integer
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE TABLE `subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`plan` text NOT NULL,
	`referenceId` text NOT NULL,
	`stripeCustomerId` text,
	`stripeSubscriptionId` text,
	`status` text NOT NULL,
	`periodStart` integer,
	`periodEnd` integer,
	`trialStart` integer,
	`trialEnd` integer,
	`cancelAtPeriodEnd` integer,
	`cancelAt` integer,
	`canceledAt` integer,
	`endedAt` integer,
	`seats` integer,
	`billingInterval` text,
	`stripeScheduleId` text
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`stripeCustomerId` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `demo_transcripts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workflow_id` text NOT NULL,
	`kind` text NOT NULL,
	`phase` text DEFAULT 'queued' NOT NULL,
	`surface_id` text,
	`skill_id` text,
	`raw_text` text,
	`clean_text` text,
	`duration_ms` integer,
	`audio_bytes` integer,
	`word_count` integer,
	`locale` text,
	`ip_hash` text NOT NULL,
	`error_message` text,
	`cancelled_at` integer,
	`phase_updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `demo_transcripts_workflow_id_unique` ON `demo_transcripts` (`workflow_id`);--> statement-breakpoint
CREATE INDEX `idx_demo_transcripts_created_at` ON `demo_transcripts` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_demo_transcripts_ip_hash` ON `demo_transcripts` (`ip_hash`);--> statement-breakpoint
CREATE TABLE `cleanup_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`rating` text NOT NULL,
	`raw_text` text NOT NULL,
	`formatted_text` text NOT NULL,
	`language` text NOT NULL,
	`word_count` integer NOT NULL,
	`diff_ratio` real NOT NULL,
	`transcription_created_at` text NOT NULL,
	`platform` text NOT NULL,
	`os` text NOT NULL,
	`bundle_id` text,
	`host` text,
	`app_category` text,
	`installed_skill_count` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cleanup_feedback_user_id_idx` ON `cleanup_feedback` (`user_id`);--> statement-breakpoint
CREATE INDEX `cleanup_feedback_created_at_idx` ON `cleanup_feedback` (`created_at`);