// The guest demo cleanup runs the same core harness as the authenticated path, so the
// public demo keeps the same default cleanup, lexicon semantics, intent boundaries,
// and prompt-injection defense.
export const DEMO_CLEANUP_KEYS = [
  "harness/agent-identity.md",
  "harness/lexicon-policy.md",
  "harness/default-cleanup.md",
  "harness/intent-policy.md",
  "harness/execution-policy.md",
] as const;

export const DEMO_AUDIO_MAX_BYTES = 5 * 1024 * 1024;
