import type { Snippet } from "./dictionary";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Triggers only match as whole words/phrases: bounded by start/end of text,
// whitespace, punctuation, or symbols — never inside another word.
const BOUNDARY_BEFORE = String.raw`(?<=^|[\s\p{P}\p{S}])`;
const BOUNDARY_AFTER = String.raw`(?=$|[\s\p{P}\p{S}])`;

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
