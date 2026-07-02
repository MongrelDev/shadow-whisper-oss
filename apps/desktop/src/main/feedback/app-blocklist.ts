export const AUTO_TEACH_APP_BLOCKLIST = new Set<string>([
  // Begin empty per planning/auto-teach-edit-monitor.md decisions table.
  // Future candidates (commented for visibility): "com.1password.1password", "com.bitwarden.desktop".
]);

export const isBlockedBundle = (id: string | null): boolean =>
  id !== null && AUTO_TEACH_APP_BLOCKLIST.has(id);
