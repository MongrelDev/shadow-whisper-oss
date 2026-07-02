import { describe, it, expect } from "vitest";

import { extractCandidates } from "./candidate-extractor";

describe("extractCandidates", () => {
  it("skips when original text is empty", () => {
    expect(extractCandidates("", "anything", new Set())).toEqual({
      kind: "skip",
      reason: "empty",
    });
  });

  it("skips when edited text is empty", () => {
    expect(extractCandidates("hello world", "", new Set())).toEqual({
      kind: "skip",
      reason: "empty",
    });
  });

  it("skips when original and edited are identical", () => {
    expect(extractCandidates("hello", "hello", new Set())).toEqual({
      kind: "skip",
      reason: "identical",
    });
  });

  it("skips when edited is more than 3x the original length (continuation)", () => {
    expect(
      extractCandidates(
        "hi",
        "hi and then a long story about something else entirely with many words",
        new Set()
      )
    ).toEqual({ kind: "skip", reason: "continuation" });
  });

  it("skips when no diff region is detected (edited contains original verbatim within 3x cap)", () => {
    const original = "hello world";
    const edited = "abc hello world def ghi";
    expect(extractCandidates(original, edited, new Set())).toEqual({
      kind: "skip",
      reason: "no_diff_region",
    });
  });

  it("skips when more than 50% of words changed (rewrite)", () => {
    expect(
      extractCandidates("one two three four five", "uno two trois four cinco", new Set())
    ).toEqual({ kind: "skip", reason: "rewrite" });
  });

  it("returns a single phonetic correction pair", () => {
    expect(
      extractCandidates("I met Shunade yesterday", "I met Sinéad yesterday", new Set())
    ).toEqual({
      kind: "send",
      candidates: [{ from: "Shunade", to: "Sinéad" }],
    });
  });

  it("returns only true-substitution pairs and drops case-only changes", () => {
    expect(
      extractCandidates(
        "Spoke with Shunade about react native",
        "Spoke with Sinéad about React Native",
        new Set()
      )
    ).toEqual({
      kind: "send",
      candidates: [{ from: "Shunade", to: "Sinéad" }],
    });
  });

  it("skips when the only candidate is already in the user dictionary", () => {
    expect(extractCandidates("I met Shunade", "I met Sinéad", new Set(["sinéad"]))).toEqual({
      kind: "skip",
      reason: "no_candidates",
    });
  });

  it("skips when edit-distance ratio exceeds 0.65", () => {
    expect(extractCandidates("I ate an apple", "I ate an elephant", new Set())).toEqual({
      kind: "skip",
      reason: "no_candidates",
    });
  });

  it("drops single-character substitutions (length < 3)", () => {
    expect(extractCandidates("a b", "a c", new Set())).toEqual({
      kind: "skip",
      reason: "no_candidates",
    });
  });

  it("does not produce substitution candidates for pure insertions inside a larger field", () => {
    expect(extractCandidates("João Silva", "Hello João da Silva.", new Set())).toEqual({
      kind: "skip",
      reason: "no_candidates",
    });
  });
});
