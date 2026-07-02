import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const APP_REGISTRY_CATEGORIES = [
  "code-editor",
  "email",
  "messaging",
  "browser",
  "notes",
  "terminal",
  "design",
  "meeting",
  "social",
  "productivity",
  "other",
] as const;

export type AppRegistryCategory = (typeof APP_REGISTRY_CATEGORIES)[number];

export const APP_REGISTRY_IDENTIFIER_TYPES = ["bundle", "host"] as const;

export type AppRegistryIdentifierType = (typeof APP_REGISTRY_IDENTIFIER_TYPES)[number];

// The same logical app has a different identifier per platform (macOS bundle id vs
// Windows process name vs Linux window class). Some identifiers are identical across
// Windows and Linux (e.g. "slack"), so the unique key is (platform, identifier).
// Websites live in app_host_registry instead and are platform-agnostic.
export const APP_REGISTRY_PLATFORMS = [
  "macos",
  "windows",
  "linux",
  "web",
  "extension",
  "android",
  "ios",
] as const;

export type AppRegistryPlatform = (typeof APP_REGISTRY_PLATFORMS)[number];

// Native applications, keyed per platform. `host_name` is the display name (e.g. "VS Code").
export const appRegistry = sqliteTable(
  "app_registry",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    platform: text("platform", { enum: APP_REGISTRY_PLATFORMS }).notNull().default("macos"),
    identifier: text("identifier").notNull(),
    hostName: text("host_name").notNull(),
    category: text("category", { enum: APP_REGISTRY_CATEGORIES }).notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("app_registry_platform_identifier_idx").on(t.platform, t.identifier),
    index("app_registry_category_idx").on(t.category),
  ]
);

// Websites. `host` is the domain (e.g. "mail.google.com"); `host_name` is the display
// name (e.g. "Gmail"). Platform-agnostic — a site is the same across every OS/extension.
export const appHostRegistry = sqliteTable(
  "app_host_registry",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    host: text("host").notNull(),
    hostName: text("host_name").notNull(),
    category: text("category", { enum: APP_REGISTRY_CATEGORIES }).notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("app_host_registry_host_idx").on(t.host),
    index("app_host_registry_category_idx").on(t.category),
  ]
);

export const appRegistryCandidates = sqliteTable(
  "app_registry_candidates",
  {
    identifier: text("identifier").primaryKey(),
    identifierType: text("identifier_type", {
      enum: APP_REGISTRY_IDENTIFIER_TYPES,
    }).notNull(),
    occurrenceCount: integer("occurrence_count").notNull().default(1),
    lastSeenAt: integer("last_seen_at").notNull(),
    promotedAt: integer("promoted_at"),
  },
  (t) => [index("app_registry_candidates_count_idx").on(t.occurrenceCount)]
);
