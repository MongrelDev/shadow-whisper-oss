import type { Snippet } from "./dictionary";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Triggers only match as whole words/phrases: the characters immediately around
// a match must not be letters, digits, or intra-word connectors. Hyphen and
// apostrophe are connectors, not boundaries — otherwise a trigger "ask" would
// expand inside "re-ask" and "don't" would break at "don". Start/end of text
// count as boundaries because a negative lookaround succeeds with nothing there.
const INTRA_WORD = String.raw`\p{L}\p{N}_'’\-`;
const BOUNDARY_BEFORE = String.raw`(?<![${INTRA_WORD}])`;
const BOUNDARY_AFTER = String.raw`(?![${INTRA_WORD}])`;

const normalizeTrigger = (trigger: string) => trigger.trim().replace(/\s+/g, " ").toLowerCase();

const triggerPattern = (trigger: string) =>
  trigger
    .split(" ")
    .map(escapeRegex)
    .join(String.raw`\s+`);

export const expandSnippets = (text: string, snippets: readonly Snippet[]): string => {
  const byTrigger = new Map<string, string>();
  for (const snippet of snippets) {
    const key = normalizeTrigger(snippet.triggerPhrase);
    if (key.length === 0 || byTrigger.has(key)) continue;
    byTrigger.set(key, snippet.expandedText);
  }
  if (byTrigger.size === 0) return text;

  // Longest trigger first so "investor ask" wins over "ask" at the same position.
  // Single pass: expanded output is never re-scanned, so snippets cannot chain.
  const alternation = [...byTrigger.keys()]
    .sort((a, b) => b.length - a.length)
    .map(triggerPattern)
    .join("|");
  const matcher = new RegExp(`${BOUNDARY_BEFORE}(?:${alternation})${BOUNDARY_AFTER}`, "giu");

  return text.replace(matcher, (match) => byTrigger.get(normalizeTrigger(match)) ?? match);
};
