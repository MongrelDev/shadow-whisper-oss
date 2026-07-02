CREATE TABLE IF NOT EXISTS waitlist_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('macos', 'windows', 'linux')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_entries_email_platform_idx
  ON waitlist_entries(email, platform);
