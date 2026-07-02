import { describe, expect, it } from "vitest";
import type { DailyBreakdownItem } from "@whisper/api";
import { aggregateByHost, groupByPlatformOs, topAppsWithOther } from "./aggregate";

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

describe("aggregate heatmap helpers", () => {
  it("aggregates app usage by host and sorts by word count descending", () => {
    expect(
      aggregateByHost([
        item({
          hostName: "Gmail",
          category: "email",
          wordCount: 50,
          durationMs: 10,
          entryCount: 1,
        }),
        item({
          hostName: "VS Code",
          category: "code-editor",
          wordCount: 200,
          durationMs: 20,
          entryCount: 2,
        }),
        item({
          hostName: "Gmail",
          category: "email",
          wordCount: 75,
          durationMs: 15,
          entryCount: 1,
        }),
      ])
    ).toEqual([
      {
        hostName: "VS Code",
        category: "code-editor",
        wordCount: 200,
        durationMs: 20,
        entryCount: 2,
      },
      { hostName: "Gmail", category: "email", wordCount: 125, durationMs: 25, entryCount: 2 },
    ]);
  });

  it("groups by platform and OS with stable platform ordering", () => {
    expect(
      groupByPlatformOs([
        item({ platform: "extension", os: "chrome", hostName: "Gmail", wordCount: 100 }),
        item({ platform: "desktop", os: "macos", hostName: "VS Code", wordCount: 300 }),
        item({ platform: "desktop", os: "windows", hostName: "Word", wordCount: 200 }),
      ])
    ).toMatchObject([
      { platform: "desktop", os: "macos", totalWordCount: 300 },
      { platform: "desktop", os: "windows", totalWordCount: 200 },
      { platform: "extension", os: "chrome", totalWordCount: 100 },
    ]);
  });

  it("splits top apps from an aggregated other bucket", () => {
    const result = topAppsWithOther(
      [
        { hostName: "A", category: "email", wordCount: 100, durationMs: 10, entryCount: 1 },
        { hostName: "B", category: "chat", wordCount: 80, durationMs: 8, entryCount: 1 },
        { hostName: "C", category: "browser", wordCount: 20, durationMs: 2, entryCount: 1 },
      ],
      2
    );

    expect(result).toEqual({
      top: [
        { hostName: "A", category: "email", wordCount: 100, durationMs: 10, entryCount: 1 },
        { hostName: "B", category: "chat", wordCount: 80, durationMs: 8, entryCount: 1 },
      ],
      other: { hostName: "other", category: "other", wordCount: 20, durationMs: 2, entryCount: 1 },
    });
  });
});
