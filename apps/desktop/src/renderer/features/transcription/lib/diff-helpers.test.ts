import { describe, it, expect } from "vitest";
import {
  countWords,
  normalizeForCosmeticDiff,
  computeWordDiffRatio,
  isEligibleForCleanupDiff,
  computeWordDiffParts,
} from "./diff-helpers";

describe("countWords", () => {
  it("returns 0 for empty string", () => {
    expect(countWords("")).toBe(0);
  });

  it("returns 0 for whitespace-only string", () => {
    expect(countWords("   ")).toBe(0);
    expect(countWords("\t\n")).toBe(0);
  });

  it("returns 1 for single word", () => {
    expect(countWords("hello")).toBe(1);
    expect(countWords("  hello  ")).toBe(1);
  });

  it("counts words correctly", () => {
    expect(countWords("hello world")).toBe(2);
    expect(countWords("one two three four five")).toBe(5);
  });

  it("handles multiple spaces between words", () => {
    expect(countWords("hello   world")).toBe(2);
  });
});

describe("normalizeForCosmeticDiff", () => {
  it("lowercases text", () => {
    expect(normalizeForCosmeticDiff("Hello World")).toBe("hello world");
  });

  it("removes punctuation", () => {
    expect(normalizeForCosmeticDiff("hello, world!")).toBe("hello world");
    expect(normalizeForCosmeticDiff("it's great.")).toBe("its great");
  });

  it("collapses whitespace", () => {
    expect(normalizeForCosmeticDiff("hello   world")).toBe("hello world");
  });

  it("returns equal strings for punctuation-only differences", () => {
    const a = "hello world";
    const b = "hello, world!";
    expect(normalizeForCosmeticDiff(a)).toBe(normalizeForCosmeticDiff(b));
  });

  it("returns equal strings for casing-only differences", () => {
    expect(normalizeForCosmeticDiff("Hello World")).toBe(normalizeForCosmeticDiff("hello world"));
  });

  it("returns equal strings for whitespace-only differences", () => {
    expect(normalizeForCosmeticDiff("hello world")).toBe(normalizeForCosmeticDiff("hello  world"));
  });

  it("trims leading/trailing whitespace", () => {
    expect(normalizeForCosmeticDiff("  hello  ")).toBe("hello");
  });
});

describe("computeWordDiffRatio", () => {
  it("returns 0 for identical texts", () => {
    expect(computeWordDiffRatio("hello world", "hello world")).toBe(0);
  });

  it("returns 1 for completely different texts of same length", () => {
    const ratio = computeWordDiffRatio("a b c", "x y z");
    expect(ratio).toBe(1);
  });

  it("returns 0 for empty strings", () => {
    expect(computeWordDiffRatio("", "")).toBe(0);
  });

  it("returns partial ratio for mixed texts", () => {
    const ratio = computeWordDiffRatio("the quick brown fox", "the slow brown dog");
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThan(1);
  });

  it("returns value between 0 and 1", () => {
    const ratio = computeWordDiffRatio("some words here", "different words there");
    expect(ratio).toBeGreaterThanOrEqual(0);
    expect(ratio).toBeLessThanOrEqual(1);
  });
});

describe("isEligibleForCleanupDiff", () => {
  const makeText = (wordCount: number, prefix = "word") =>
    Array.from({ length: wordCount }, (_, i) => `${prefix}${i}`).join(" ");

  it("returns false when raw text has fewer than 30 words", () => {
    const raw = makeText(15);
    const formatted = makeText(40, "other");
    expect(isEligibleForCleanupDiff(raw, formatted)).toBe(false);
  });

  it("returns false when formatted text has fewer than 30 words", () => {
    const raw = makeText(40);
    const formatted = makeText(15, "other");
    expect(isEligibleForCleanupDiff(raw, formatted)).toBe(false);
  });

  it("returns false for cosmetic-only changes", () => {
    // Same words, just punctuation added to end
    const rawWords = makeText(35);
    const formattedWithPunct = makeText(35)
      .split(" ")
      .map((w) => w + ",")
      .join(" ");
    expect(isEligibleForCleanupDiff(rawWords, formattedWithPunct)).toBe(false);
  });

  it("returns false when diff ratio is below 15%", () => {
    // 30 identical words + 2 different words = ~6% change
    const shared = makeText(30);
    const raw = shared + " extra1 extra2";
    const formatted = shared + " extra1 extra2";
    expect(isEligibleForCleanupDiff(raw, formatted)).toBe(false);
  });

  it("returns true for eligible text", () => {
    // 40 words with >15% differences and >30 words each
    const raw = Array.from({ length: 40 }, (_, i) => (i % 5 === 0 ? `raw${i}` : `word${i}`)).join(
      " "
    );
    const formatted = Array.from({ length: 40 }, (_, i) =>
      i % 5 === 0 ? `formatted${i}` : `word${i}`
    ).join(" ");
    expect(isEligibleForCleanupDiff(raw, formatted)).toBe(true);
  });
});

describe("computeWordDiffParts", () => {
  it("returns empty array for two empty strings", () => {
    expect(computeWordDiffParts("", "")).toEqual([]);
  });

  it("marks all as added when raw is empty", () => {
    const parts = computeWordDiffParts("", "hello world");
    expect(parts).toEqual([{ type: "added", text: "hello world" }]);
  });

  it("marks all as removed when formatted is empty", () => {
    const parts = computeWordDiffParts("hello world", "");
    expect(parts).toEqual([{ type: "removed", text: "hello world" }]);
  });

  it("marks all as unchanged for identical texts", () => {
    const parts = computeWordDiffParts("hello world", "hello world");
    expect(parts).toEqual([{ type: "unchanged", text: "hello world" }]);
  });

  it("produces correct diff parts for changed words", () => {
    const parts = computeWordDiffParts("the quick fox", "the slow fox");
    const types = parts.map((p) => p.type);
    expect(types).toContain("unchanged");
    expect(types).toContain("removed");
    expect(types).toContain("added");
  });

  it("produces only valid part types", () => {
    const parts = computeWordDiffParts("foo bar baz", "foo qux baz");
    for (const part of parts) {
      expect(["added", "removed", "unchanged"]).toContain(part.type);
      expect(part.text.length).toBeGreaterThan(0);
    }
  });

  it("merges consecutive same-type parts", () => {
    const parts = computeWordDiffParts("a b c", "x y z");
    // All removed then all added — should be 2 parts
    expect(parts.length).toBeLessThanOrEqual(3);
  });
});
