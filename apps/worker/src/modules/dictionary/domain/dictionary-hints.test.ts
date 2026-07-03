import { describe, expect, it } from "vitest";
import type { Dictionary } from "./dictionary";
import { collectDictionaryHints } from "./dictionary-hints";

const dictionary = (words: string[], triggers: string[]): Dictionary => ({
  words: words.map((word, i) => ({ id: i + 1, word, createdAt: 0 })),
  snippets: triggers.map((triggerPhrase, i) => ({
    id: i + 1,
    triggerPhrase,
    expandedText: `expansion-${i}`,
    createdAt: 0,
  })),
});

describe("collectDictionaryHints", () => {
  it("merges dictionary words with snippet trigger phrases", () => {
    const hints = collectDictionaryHints(dictionary(["Kubernetes", "Effect"], ["email signature"]));
    expect(hints).toEqual(["Kubernetes", "Effect", "email signature"]);
  });

  it("dedupes case-insensitively, keeping the first spelling", () => {
    const hints = collectDictionaryHints(dictionary(["Sinead"], ["sinead", "brb"]));
    expect(hints).toEqual(["Sinead", "brb"]);
  });

  it("drops blank terms and trims whitespace", () => {
    const hints = collectDictionaryHints(dictionary(["  Zed  ", "   "], [""]));
    expect(hints).toEqual(["Zed"]);
  });

  it("returns an empty list for an empty dictionary", () => {
    expect(collectDictionaryHints(dictionary([], []))).toEqual([]);
  });
});
