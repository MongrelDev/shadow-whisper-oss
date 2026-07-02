CREATE TABLE `app_variety_today` (
	`user_id` text NOT NULL,
	`local_date` text NOT NULL,
	`identifier` text NOT NULL,
	PRIMARY KEY(`user_id`, `local_date`, `identifier`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE TABLE `usage_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`word_count` integer NOT NULL,
	`bundle_id` text,
	`site_host` text,
	`surface_context` text,
	`engines_json` text,
	`duration_ms` integer NOT NULL,
	`created_at` integer NOT NULL,
	`skill_id` text,
	`skill_version` integer,
	`input_word_count` integer,
	`output_word_count` integer,
	`success` integer DEFAULT 1 NOT NULL,
	`platform` text NOT NULL,
	`os` text NOT NULL,
	`language` text,
	`local_date` text NOT NULL,
	`local_hour` integer NOT NULL,
	`timezone` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `usage_entries_user_created_at_idx` ON `usage_entries` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `usage_entries_user_local_date_idx` ON `usage_entries` (`user_id`,`local_date`);--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`user_id` text NOT NULL,
	`achievement_key` text NOT NULL,
	`earned_at` integer NOT NULL,
	`context_json` text,
	PRIMARY KEY(`user_id`, `achievement_key`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE TABLE `user_summary` (
	`user_id` text PRIMARY KEY NOT NULL,
	`total_words` integer DEFAULT 0 NOT NULL,
	`all_time_daily_best` integer DEFAULT 0 NOT NULL,
	`max_streak` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE TABLE `custom_skills` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`slug` text NOT NULL,
	`display_name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`markdown` text NOT NULL,
	`triggers` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `custom_skills_user_idx` ON `custom_skills` (`user_id`);--> statement-breakpoint
CREATE TABLE `dictionary_snippets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`trigger_phrase` text NOT NULL,
	`expanded_text` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `dictionary_snippets_user_idx` ON `dictionary_snippets` (`user_id`);--> statement-breakpoint
CREATE TABLE `dictionary_words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`word` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `dictionary_words_user_idx` ON `dictionary_words` (`user_id`);--> statement-breakpoint
CREATE TABLE `installed_skills` (
	`user_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`display_name` text NOT NULL,
	`description` text NOT NULL,
	`slug` text NOT NULL,
	`installed_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE UNIQUE INDEX `installed_skills_user_skill_idx` ON `installed_skills` (`user_id`,`skill_id`);--> statement-breakpoint
CREATE TABLE `learned_words` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source` text NOT NULL,
	`replacement` text NOT NULL,
	`source_lower` text NOT NULL,
	`context` text,
	`frequency` integer DEFAULT 1 NOT NULL,
	`last_used_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE UNIQUE INDEX `learned_words_user_source_lower_idx` ON `learned_words` (`user_id`,`source_lower`);--> statement-breakpoint
CREATE TABLE `pending_suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`feedback_id` text NOT NULL,
	`original` text NOT NULL,
	`replacement` text NOT NULL,
	`context` text DEFAULT '' NOT NULL,
	`selected_text` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`source` text DEFAULT 'teach' NOT NULL,
	`matched_session_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `pending_suggestions_user_status_idx` ON `pending_suggestions` (`user_id`,`status`);