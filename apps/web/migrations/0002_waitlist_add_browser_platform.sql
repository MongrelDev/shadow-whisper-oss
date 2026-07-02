-- Recreate waitlist_entries with browser added to platform CHECK constraint.
-- SQLite does not support ALTER TABLE ... MODIFY COLUMN, so we use the
-- rename-create-copy-drop pattern.

ALTER TABLE waitlist_entries RENAME TO waitlist_entries_old;

DROP INDEX IF EXISTS waitlist_entries_email_platform_idx;

CREATE TABLE waitlist_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('macos', 'windows', 'linux', 'browser')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX waitlist_entries_email_platform_idx
  ON waitlist_entries(email, platform);

INSERT INTO waitlist_entries (id, email, platform, created_at)
  SELECT id, email, platform, created_at FROM waitlist_entries_old;

DROP TABLE waitlist_entries_old;
