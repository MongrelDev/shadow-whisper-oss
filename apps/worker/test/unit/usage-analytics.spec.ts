import { describe, it, expect } from "vitest";
import {
  computeStreak,
  countConsecutiveDays,
  streakAnchor,
  computeWpm,
  isWpmEligible,
  MIN_WPM_DURATION_MS,
  MIN_WPM_WORDS,
  utcDateString,
  subtractDays,
  computeLocalDateHour,
  primaryLanguage,
  countDistinctPrimaryLanguages,
  countQualifyingLanguages,
  languageForUsageStat,
  BILINGUAL_MIN_WORDS_PER_LANGUAGE,
  MARATHON_SESSION_WORDS,
  MIN_WORDS_FOR_LANGUAGE_STAT,
  MIN_DURATION_MS_FOR_LANGUAGE_STAT,
  evaluateMilestoneCrossings,
  ACHIEVEMENT_RULES,
  MILESTONE_THRESHOLDS,
  type ProgressSnapshot,
  type UnlockSnapshot,
  type RecordedEntry,
} from "../../src/modules/usage/domain/usage-analytics";

// ── Helpers ──

const baseEntry: RecordedEntry = {
  wordCount: 200,
  inputWordCount: null,
  durationMs: 120_000,
  language: "en",
  createdAt: Date.UTC(2026, 0, 15, 12, 0, 0),
};

const baseProgress: ProgressSnapshot = {
  todayUtc: "2026-01-15",
  successEntryCount: 5,
  currentStreak: 1,
  todayWordCountUtc: 500,
  bestSessionWordsAllTime: 300,
  distinctAppsToday: 1,
  qualifyingLanguagesAllTime: 1,
  distinctSkillsAllTime: 0,
  distinctPlatformsToday: 1,
};

const baseSnap: UnlockSnapshot = {
  ...baseProgress,
  entry: baseEntry,
};

function findRule(key: string) {
  const rule = ACHIEVEMENT_RULES.find((r) => r.key === key);
  if (!rule) throw new Error(`Rule not found: ${key}`);
  return rule;
}

// ── Date/Time ──

describe("utcDateString", () => {
  it("formats epoch millis as YYYY-MM-DD", () => {
    expect(utcDateString(Date.UTC(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("subtractDays", () => {
  it("subtracts days from a date string", () => {
    expect(subtractDays("2026-01-10", 3)).toBe("2026-01-07");
  });

  it("crosses month boundary", () => {
    expect(subtractDays("2026-02-02", 5)).toBe("2026-01-28");
  });
});

describe("computeLocalDateHour", () => {
  it("returns local date and hour for a valid timezone", () => {
    const ms = Date.UTC(2026, 5, 15, 18, 30, 0);
    const result = computeLocalDateHour(ms, "America/Sao_Paulo");
    expect(result.localDate).toBe("2026-06-15");
    expect(result.localHour).toBe(15);
  });

  it("falls back to UTC for invalid timezone", () => {
    const ms = Date.UTC(2026, 5, 15, 18, 30, 0);
    const result = computeLocalDateHour(ms, "Invalid/Zone");
    expect(result.localDate).toBe("2026-06-15");
    expect(result.localHour).toBe(18);
  });
});

// ── Streak ──

describe("streakAnchor", () => {
  it("returns today if first day matches", () => {
    expect(streakAnchor(["2026-01-15", "2026-01-14"], "2026-01-15")).toBe("2026-01-15");
  });

  it("returns yesterday if first day is yesterday", () => {
    expect(streakAnchor(["2026-01-14", "2026-01-13"], "2026-01-15")).toBe("2026-01-14");
  });

  it("returns null if gap is too large", () => {
    expect(streakAnchor(["2026-01-12"], "2026-01-15")).toBeNull();
  });

  it("returns null for empty array", () => {
    expect(streakAnchor([], "2026-01-15")).toBeNull();
  });
});

describe("countConsecutiveDays", () => {
  it("counts consecutive days from anchor", () => {
    expect(countConsecutiveDays(["2026-01-15", "2026-01-14", "2026-01-13"], "2026-01-15")).toBe(3);
  });

  it("stops at gap", () => {
    expect(countConsecutiveDays(["2026-01-15", "2026-01-13"], "2026-01-15")).toBe(1);
  });
});

describe("computeStreak", () => {
  it("computes streak including today", () => {
    expect(computeStreak(["2026-01-15", "2026-01-14", "2026-01-13"], "2026-01-15")).toBe(3);
  });

  it("computes streak from yesterday", () => {
    expect(computeStreak(["2026-01-14", "2026-01-13", "2026-01-12"], "2026-01-15")).toBe(3);
  });

  it("returns 0 when no recent activity", () => {
    expect(computeStreak(["2026-01-10"], "2026-01-15")).toBe(0);
  });

  it("returns 0 for empty days", () => {
    expect(computeStreak([], "2026-01-15")).toBe(0);
  });
});

// ── WPM ──

describe("computeWpm", () => {
  it("calculates words per minute", () => {
    expect(computeWpm(100, 60_000)).toBe(100);
    expect(computeWpm(200, 120_000)).toBe(100);
  });

  it("returns 0 for zero or negative duration", () => {
    expect(computeWpm(100, 0)).toBe(0);
    expect(computeWpm(100, -1000)).toBe(0);
  });
});

describe("isWpmEligible", () => {
  it("requires minimum duration and words", () => {
    expect(isWpmEligible(MIN_WPM_WORDS, MIN_WPM_DURATION_MS)).toBe(true);
    expect(isWpmEligible(MIN_WPM_WORDS - 1, MIN_WPM_DURATION_MS)).toBe(false);
    expect(isWpmEligible(MIN_WPM_WORDS, MIN_WPM_DURATION_MS - 1)).toBe(false);
  });
});

// ── Language ──

describe("primaryLanguage", () => {
  it("extracts primary language code", () => {
    expect(primaryLanguage("en-US")).toBe("en");
    expect(primaryLanguage("pt-BR")).toBe("pt");
    expect(primaryLanguage("en")).toBe("en");
  });

  it("normalizes to lowercase", () => {
    expect(primaryLanguage("EN-US")).toBe("en");
  });

  it("returns null for null or empty", () => {
    expect(primaryLanguage(null)).toBeNull();
    expect(primaryLanguage("")).toBeNull();
    expect(primaryLanguage("  ")).toBeNull();
  });
});

describe("countDistinctPrimaryLanguages", () => {
  it("counts distinct primary languages", () => {
    expect(countDistinctPrimaryLanguages(["en-US", "pt-BR", "en-GB"])).toBe(2);
  });

  it("returns 0 for empty or null-only array", () => {
    expect(countDistinctPrimaryLanguages([])).toBe(0);
    expect(countDistinctPrimaryLanguages([null, null])).toBe(0);
  });
});

// ── Milestone Crossings ──

describe("evaluateMilestoneCrossings", () => {
  it("detects single milestone crossing", () => {
    const crossings = evaluateMilestoneCrossings(9_000, 11_000);
    expect(crossings).toHaveLength(1);
    expect(crossings[0]!.key).toBe("milestone_10k");
  });

  it("detects multiple crossings at once", () => {
    const crossings = evaluateMilestoneCrossings(9_000, 30_000);
    const keys = crossings.map((c) => c.key);
    expect(keys).toContain("milestone_10k");
    expect(keys).toContain("milestone_25k");
    expect(keys).not.toContain("milestone_50k");
  });

  it("returns empty when no crossing", () => {
    expect(evaluateMilestoneCrossings(5_000, 8_000)).toHaveLength(0);
  });

  it("does not re-fire already crossed milestones", () => {
    expect(evaluateMilestoneCrossings(15_000, 20_000)).toHaveLength(0);
  });

  it("fires all six milestones from zero", () => {
    const crossings = evaluateMilestoneCrossings(0, 500_001);
    expect(crossings).toHaveLength(6);
  });

  it("produces correct contextJson", () => {
    const [crossing] = evaluateMilestoneCrossings(9_000, 10_500);
    expect(JSON.parse(crossing!.contextJson)).toEqual({ totalWords: 10_500 });
  });

  it("fires at exact threshold", () => {
    const crossings = evaluateMilestoneCrossings(
      MILESTONE_THRESHOLDS.milestone_50k - 1,
      MILESTONE_THRESHOLDS.milestone_50k
    );
    expect(crossings).toHaveLength(1);
    expect(crossings[0]!.key).toBe("milestone_50k");
  });
});

// ── Achievement Rules ──

describe("first_transcription", () => {
  const rule = findRule("first_transcription");

  it("unlocks on first entry", () => {
    const snap = { ...baseSnap, successEntryCount: 1 };
    expect(rule.evaluate(snap)).toEqual({ contextJson: null });
  });

  it("does not unlock on subsequent entries", () => {
    const snap = { ...baseSnap, successEntryCount: 2 };
    expect(rule.evaluate(snap)).toBeNull();
  });

  it("reports progress", () => {
    expect(rule.progress({ ...baseProgress, successEntryCount: 0 })).toEqual({
      current: 0,
      target: 1,
      label: "transcriptions",
    });
  });
});

describe("streak_7", () => {
  const rule = findRule("streak_7");

  it("unlocks at 7-day streak", () => {
    const snap = { ...baseSnap, currentStreak: 7 };
    expect(rule.evaluate(snap)).not.toBeNull();
  });

  it("does not unlock below threshold", () => {
    const snap = { ...baseSnap, currentStreak: 6 };
    expect(rule.evaluate(snap)).toBeNull();
  });

  it("reports progress", () => {
    expect(rule.progress({ ...baseProgress, currentStreak: 4 })).toEqual({
      current: 4,
      target: 7,
      label: "days",
    });
  });
});

describe("streak_30", () => {
  const rule = findRule("streak_30");

  it("unlocks at 30-day streak", () => {
    expect(rule.evaluate({ ...baseSnap, currentStreak: 30 })).not.toBeNull();
  });

  it("does not unlock at 29", () => {
    expect(rule.evaluate({ ...baseSnap, currentStreak: 29 })).toBeNull();
  });
});

describe("streak_90", () => {
  const rule = findRule("streak_90");

  it("unlocks at 90-day streak", () => {
    expect(rule.evaluate({ ...baseSnap, currentStreak: 90 })).not.toBeNull();
  });

  it("does not unlock at 89", () => {
    expect(rule.evaluate({ ...baseSnap, currentStreak: 89 })).toBeNull();
  });
});

describe("daily_1k_words", () => {
  const rule = findRule("daily_1k_words");

  it("unlocks at 1000 words today", () => {
    const snap = { ...baseSnap, todayWordCountUtc: 1000 };
    expect(rule.evaluate(snap)).not.toBeNull();
    const ctx = JSON.parse(rule.evaluate(snap)!.contextJson!);
    expect(ctx.wordCount).toBe(1000);
  });

  it("does not unlock below threshold", () => {
    expect(rule.evaluate({ ...baseSnap, todayWordCountUtc: 999 })).toBeNull();
  });

  it("reports progress", () => {
    expect(rule.progress({ ...baseProgress, todayWordCountUtc: 500 })).toEqual({
      current: 500,
      target: 1000,
      label: "words today",
    });
  });
});

describe("daily_3k_words", () => {
  const rule = findRule("daily_3k_words");

  it("unlocks at 3000 words", () => {
    expect(rule.evaluate({ ...baseSnap, todayWordCountUtc: 3000 })).not.toBeNull();
  });

  it("does not unlock at 2999", () => {
    expect(rule.evaluate({ ...baseSnap, todayWordCountUtc: 2999 })).toBeNull();
  });
});

describe("daily_5k_words", () => {
  const rule = findRule("daily_5k_words");

  it("unlocks at 5000 words", () => {
    expect(rule.evaluate({ ...baseSnap, todayWordCountUtc: 5000 })).not.toBeNull();
  });

  it("does not unlock at 4999", () => {
    expect(rule.evaluate({ ...baseSnap, todayWordCountUtc: 4999 })).toBeNull();
  });
});

describe("marathon_session", () => {
  const rule = findRule("marathon_session");

  it("unlocks at the marathon threshold in a single session", () => {
    const snap: UnlockSnapshot = {
      ...baseSnap,
      entry: { ...baseEntry, wordCount: MARATHON_SESSION_WORDS },
    };
    const result = rule.evaluate(snap);
    expect(result).not.toBeNull();
    const ctx = JSON.parse(result!.contextJson!);
    expect(ctx.wordCount).toBe(MARATHON_SESSION_WORDS);
  });

  it("does not unlock below the threshold", () => {
    const snap = {
      ...baseSnap,
      entry: { ...baseEntry, wordCount: MARATHON_SESSION_WORDS - 1 },
    };
    expect(rule.evaluate(snap)).toBeNull();
  });

  it("reports progress capped at the target", () => {
    expect(rule.progress({ ...baseProgress, bestSessionWordsAllTime: 9999 })).toEqual({
      current: MARATHON_SESSION_WORDS,
      target: MARATHON_SESSION_WORDS,
      label: "words in one session",
    });
  });
});

describe("speed_100wpm", () => {
  const rule = findRule("speed_100wpm");

  it("unlocks at 100+ WPM with eligible duration", () => {
    const snap = {
      ...baseSnap,
      entry: { ...baseEntry, wordCount: 110, durationMs: 60_000 },
    };
    expect(rule.evaluate(snap)).not.toBeNull();
  });

  it("does not unlock below 100 WPM", () => {
    const snap = {
      ...baseSnap,
      entry: { ...baseEntry, wordCount: 90, durationMs: 60_000 },
    };
    expect(rule.evaluate(snap)).toBeNull();
  });

  it("does not unlock with ineligible duration", () => {
    const snap = {
      ...baseSnap,
      entry: { ...baseEntry, wordCount: 200, durationMs: 30_000 },
    };
    expect(rule.evaluate(snap)).toBeNull();
  });

  it("uses inputWordCount when available", () => {
    const snap = {
      ...baseSnap,
      entry: { ...baseEntry, wordCount: 50, inputWordCount: 110, durationMs: 60_000 },
    };
    expect(rule.evaluate(snap)).not.toBeNull();
  });
});

describe("speed_130wpm", () => {
  const rule = findRule("speed_130wpm");

  it("unlocks at 130+ WPM", () => {
    const snap = {
      ...baseSnap,
      entry: { ...baseEntry, wordCount: 140, durationMs: 60_000 },
    };
    expect(rule.evaluate(snap)).not.toBeNull();
  });

  it("does not unlock at 129 WPM", () => {
    const snap = {
      ...baseSnap,
      entry: { ...baseEntry, wordCount: 129, durationMs: 60_000 },
    };
    expect(rule.evaluate(snap)).toBeNull();
  });
});

describe("app_variety_5", () => {
  const rule = findRule("app_variety_5");

  it("unlocks at 5 distinct apps today", () => {
    expect(rule.evaluate({ ...baseSnap, distinctAppsToday: 5 })).not.toBeNull();
  });

  it("does not unlock at 4", () => {
    expect(rule.evaluate({ ...baseSnap, distinctAppsToday: 4 })).toBeNull();
  });

  it("reports progress", () => {
    expect(rule.progress({ ...baseProgress, distinctAppsToday: 3 })).toEqual({
      current: 3,
      target: 5,
      label: "apps today",
    });
  });
});

describe("bilingual", () => {
  const rule = findRule("bilingual");

  it("unlocks at 2 qualifying languages", () => {
    expect(rule.evaluate({ ...baseSnap, qualifyingLanguagesAllTime: 2 })).not.toBeNull();
  });

  it("does not unlock at 1", () => {
    expect(rule.evaluate({ ...baseSnap, qualifyingLanguagesAllTime: 1 })).toBeNull();
  });
});

describe("countQualifyingLanguages", () => {
  it("counts only languages with enough accumulated words", () => {
    const totals = [
      { language: "en-US", words: BILINGUAL_MIN_WORDS_PER_LANGUAGE },
      { language: "pt-BR", words: BILINGUAL_MIN_WORDS_PER_LANGUAGE - 1 },
    ];
    expect(countQualifyingLanguages(totals, BILINGUAL_MIN_WORDS_PER_LANGUAGE)).toBe(1);
  });

  it("merges regional variants into one primary language", () => {
    const totals = [
      { language: "en-US", words: 60 },
      { language: "en-GB", words: 60 },
    ];
    expect(countQualifyingLanguages(totals, 100)).toBe(1);
  });

  it("counts two distinct primaries that both qualify", () => {
    const totals = [
      { language: "en", words: 150 },
      { language: "pt-BR", words: 120 },
    ];
    expect(countQualifyingLanguages(totals, 100)).toBe(2);
  });
});

describe("skill_explorer", () => {
  const rule = findRule("skill_explorer");

  it("unlocks at 3 distinct skills", () => {
    expect(rule.evaluate({ ...baseSnap, distinctSkillsAllTime: 3 })).not.toBeNull();
  });

  it("does not unlock at 2", () => {
    expect(rule.evaluate({ ...baseSnap, distinctSkillsAllTime: 2 })).toBeNull();
  });

  it("reports progress", () => {
    expect(rule.progress({ ...baseProgress, distinctSkillsAllTime: 1 })).toEqual({
      current: 1,
      target: 3,
      label: "skills",
    });
  });
});

describe("languageForUsageStat", () => {
  const okWords = MIN_WORDS_FOR_LANGUAGE_STAT;
  const okMs = MIN_DURATION_MS_FOR_LANGUAGE_STAT;

  it("returns the detected language when clip clears word and duration floors", () => {
    expect(languageForUsageStat("pt", okWords, okMs)).toBe("pt");
  });

  it("drops single-word clips even when long", () => {
    expect(languageForUsageStat("pt", 1, 10_000)).toBeNull();
  });

  it("drops clips below the duration floor", () => {
    expect(languageForUsageStat("pt", okWords, okMs - 1)).toBeNull();
  });

  it("drops clips below the word floor", () => {
    expect(languageForUsageStat("en", okWords - 1, okMs)).toBeNull();
  });

  it("returns null when no language was detected", () => {
    expect(languageForUsageStat(undefined, okWords, okMs)).toBeNull();
    expect(languageForUsageStat(null, okWords, okMs)).toBeNull();
  });
});

describe("omnichannel", () => {
  const rule = findRule("omnichannel");

  it("unlocks at 2 distinct platforms today", () => {
    expect(rule.evaluate({ ...baseSnap, distinctPlatformsToday: 2 })).not.toBeNull();
  });

  it("does not unlock at 1", () => {
    expect(rule.evaluate({ ...baseSnap, distinctPlatformsToday: 1 })).toBeNull();
  });

  it("returns no progress", () => {
    expect(rule.progress(baseProgress)).toBeUndefined();
  });
});
