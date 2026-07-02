import { describe, expect, it } from "vitest";
import type { DailyBreakdownItem } from "@whisper/api";
import { gapFill, shiftUtcDays, toWeeks, utcDateRange } from "./calendar";

function item(overrides: Partial<DailyBreakdownItem>): DailyBreakdownItem {
  return {
    localDate: "2026-05-14",
    platform: "desktop",
    os: "macos",
    hostName: "VS Code",
    category: "code-editor",
    wordCount: 0,
    durationMs: 0,
    entryCount: 0,
    ...overrides,
  };
}

describe("calendar heatmap helpers", () => {
  it("shifts UTC dates across month boundaries", () => {
    expect(shiftUtcDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(shiftUtcDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("builds an inclusive UTC date range", () => {
    expect(utcDateRange("2026-05-14", "2026-05-17")).toEqual([
      "2026-05-14",
      "2026-05-15",
      "2026-05-16",
      "2026-05-17",
    ]);
  });

  it("gap fills empty days and aggregates multiple items on the same day", () => {
    const days = gapFill(
      [
        item({ localDate: "2026-05-14", wordCount: 120, durationMs: 10, entryCount: 1 }),
        item({ localDate: "2026-05-14", wordCount: 80, durationMs: 5, entryCount: 2 }),
        item({ localDate: "2026-05-16", wordCount: 300, durationMs: 30, entryCount: 1 }),
      ],
      "2026-05-14",
      "2026-05-16"
    );

    expect(days).toMatchObject([
      { localDate: "2026-05-14", wordCount: 200, durationMs: 15, entryCount: 3 },
      { localDate: "2026-05-15", wordCount: 0, durationMs: 0, entryCount: 0 },
      { localDate: "2026-05-16", wordCount: 300, durationMs: 30, entryCount: 1 },
    ]);
    expect(days[0]?.items).toHaveLength(2);
    expect(days[1]?.items).toEqual([]);
  });

  it("groups days into padded weeks starting on Sunday", () => {
    const days = gapFill([], "2026-05-13", "2026-05-19");
    const weeks = toWeeks(days);

    expect(weeks).toHaveLength(2);
    expect(weeks[0]?.cells.map((cell) => cell?.localDate ?? null)).toEqual([
      null,
      null,
      null,
      "2026-05-13",
      "2026-05-14",
      "2026-05-15",
      "2026-05-16",
    ]);
    expect(weeks[1]?.cells.map((cell) => cell?.localDate ?? null)).toEqual([
      "2026-05-17",
      "2026-05-18",
      "2026-05-19",
      null,
      null,
      null,
      null,
    ]);
  });
});
