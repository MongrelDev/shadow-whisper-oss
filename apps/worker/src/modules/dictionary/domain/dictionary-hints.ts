import type { Dictionary } from "./dictionary";

export const collectDictionaryHints = (dictionary: Dictionary): string[] => {
  const seen = new Set<string>();
  const hints: string[] = [];
  const terms = [
    ...dictionary.words.map((w) => w.word),
    ...dictionary.snippets.map((s) => s.triggerPhrase),
  ];
  for (const term of terms) {
    const trimmed = term.trim();
    if (trimmed.length === 0) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    hints.push(trimmed);
  }
  return hints;
};
