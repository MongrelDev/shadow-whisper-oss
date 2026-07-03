import { describe, expect, it } from "vitest";
import { collapseRepeatedRuns } from "./collapse-repetition";

describe("collapseRepeatedRuns", () => {
  it("collapses a repeated multi-word phrase to a single instance", () => {
    const looped = "thank you for watching ".repeat(9).trim();
    expect(collapseRepeatedRuns(looped)).toBe("thank you for watching");
  });

  it("collapses a repeated single word", () => {
    expect(collapseRepeatedRuns("okay okay okay okay okay okay okay")).toBe("okay");
  });

  it("collapses a CJK loop with no whitespace", () => {
    expect(collapseRepeatedRuns("谢谢观看".repeat(8))).toBe("谢谢观看");
  });

  it("collapses a loop that spans newlines", () => {
    const looped = "line\n".repeat(7);
    expect(collapseRepeatedRuns(looped)).toBe("line\n");
  });

  it("keeps a run that repeats fewer than the threshold", () => {
    expect(collapseRepeatedRuns("no no no")).toBe("no no no");
    const fiveTimes = "ha ".repeat(5).trim();
    expect(collapseRepeatedRuns(fiveTimes)).toBe(fiveTimes);
  });

  it("collapses only the looping span and preserves surrounding text", () => {
    const input = `Send the report ${"now ".repeat(8)}to the team`;
    expect(collapseRepeatedRuns(input)).toBe("Send the report now to the team");
  });

  it("leaves ordinary prose untouched", () => {
    const prose = "The quick brown fox jumps over the lazy dog. It was a good day.";
    expect(collapseRepeatedRuns(prose)).toBe(prose);
  });

  it("does not collapse a phrase that merely recurs non-consecutively", () => {
    const input = "buy milk then buy eggs then buy bread";
    expect(collapseRepeatedRuns(input)).toBe(input);
  });

  it("returns empty and single-token inputs unchanged", () => {
    expect(collapseRepeatedRuns("")).toBe("");
    expect(collapseRepeatedRuns("hello")).toBe("hello");
  });
});
