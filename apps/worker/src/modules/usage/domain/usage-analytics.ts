import type { AppRegistryEntry } from "../../transcription/domain/app-category";

export const ACHIEVEMENT_KEYS = [
  "first_transcription",
  "streak_7",
  "daily_1k_words",
  "marathon_session",
  "speed_100wpm",
  "app_variety_5",
  "bilingual",
  "streak_30",
  "streak_90",
  "daily_3k_words",
  "daily_5k_words",
  "speed_130wpm",
  "skill_explorer",
  "omnichannel",
] as const;

export type AchievementKey = (typeof ACHIEVEMENT_KEYS)[number];

export const MILESTONE_KEYS = [
  "milestone_10k",
  "milestone_25k",
  "milestone_50k",
  "milestone_100k",
  "milestone_250k",
  "milestone_500k",
] as const;

export type MilestoneKey = (typeof MILESTONE_KEYS)[number];

export const MILESTONE_THRESHOLDS: Record<MilestoneKey, number> = {
  milestone_10k: 10_000,
  milestone_25k: 25_000,
  milestone_50k: 50_000,
  milestone_100k: 100_000,
  milestone_250k: 250_000,
  milestone_500k: 500_000,
};

export interface AchievementProgress {
  readonly current: number;
  readonly target: number;
  readonly label: string;
}

export interface AchievementRow {
  readonly key: AchievementKey;
  readonly earnedAt: number | null;
  readonly contextJson: string | null;
  readonly progress?: AchievementProgress;
}

export interface UnlockedAchievement {
  readonly key: AchievementKey;
  readonly earnedAt: number;
  readonly contextJson: string | null;
}

export interface MilestoneRow {
  readonly key: MilestoneKey;
  readonly earnedAt: number | null;
  readonly contextJson: string | null;
}

export interface UnlockedMilestone {
  readonly key: MilestoneKey;
  readonly earnedAt: number;
  readonly contextJson: string | null;
}

export interface RecordUsageStats {
  readonly todayWordCount: number;
  readonly weekWordCount: number;
  readonly currentStreak: number;
  readonly wpm: number;
  readonly hasAnyEntries: boolean;
  readonly totalWords: number;
  readonly weeklyAvgWpm: number;
  readonly isFirstWeek: boolean;
}

export interface RecordUsageResult {
  readonly unlockedAchievements: ReadonlyArray<UnlockedAchievement>;
  readonly unlockedMilestones: ReadonlyArray<UnlockedMilestone>;
  readonly stats: RecordUsageStats;
}

export interface RecordedEntry {
  readonly wordCount: number;
  readonly inputWordCount: number | null;
  readonly durationMs: number;
  readonly language: string | null;
  readonly createdAt: number;
}

export interface ProgressSnapshot {
  readonly todayUtc: string;
  readonly successEntryCount: number;
  readonly currentStreak: number;
  readonly todayWordCountUtc: number;
  readonly bestSessionWordsAllTime: number;
  readonly distinctAppsToday: number;
  readonly qualifyingLanguagesAllTime: number;
  readonly distinctSkillsAllTime: number;
  readonly distinctPlatformsToday: number;
}

export interface UnlockSnapshot extends ProgressSnapshot {
  readonly entry: RecordedEntry;
}

export interface UnlockOutcome {
  readonly contextJson: string | null;
}

export interface AchievementRule {
  readonly key: AchievementKey;
  readonly evaluate: (snap: UnlockSnapshot) => UnlockOutcome | null;
  readonly progress: (snap: ProgressSnapshot) => AchievementProgress | undefined;
}

export interface MilestoneCrossing {
  readonly key: MilestoneKey;
  readonly contextJson: string;
}

export interface UserStats {
  readonly currentStreak: number;
  readonly weeklyAvgWpm: number;
  readonly totalWords: number;
  readonly isFirstWeek: boolean;
  readonly hasAnyEntries: boolean;
}

export interface DailyBreakdownRow {
  readonly localDate: string;
  readonly platform: string;
  readonly os: string;
  readonly bundleId: string | null;
  readonly siteHost: string | null;
  readonly wordCount: number;
  readonly durationMs: number;
  readonly entryCount: number;
}

export interface DisplayNameResult {
  readonly hostName: string;
  readonly category: string;
}

export interface LocalDateHour {
  readonly localDate: string;
  readonly localHour: number;
}

export const utcDateString = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

export const subtractDays = (utcDate: string, days: number): string => {
  const parts = utcDate.split("-");
  const y = Number(parts[0] ?? "1970");
  const m = Number(parts[1] ?? "1");
  const d = Number(parts[2] ?? "1");
  const t = Date.UTC(y, m - 1, d) - days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
};

export const computeLocalDateHour = (createdAtMs: number, timezone: string): LocalDateHour => {
  const date = new Date(createdAtMs);
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const hour = parseInt(get("hour"), 10);
    return {
      localDate: `${get("year")}-${get("month")}-${get("day")}`,
      localHour: Number.isFinite(hour) ? hour % 24 : 0,
    };
  } catch {
    return {
      localDate: date.toISOString().slice(0, 10),
      localHour: date.getUTCHours(),
    };
  }
};

export const countConsecutiveDays = (daysDesc: ReadonlyArray<string>, anchor: string): number => {
  let streak = 0;
  let cursorDay = anchor;
  for (const d of daysDesc) {
    if (d === cursorDay) {
      streak++;
      cursorDay = subtractDays(cursorDay, 1);
      continue;
    }
    if (d < cursorDay) break;
  }
  return streak;
};

export const streakAnchor = (daysDesc: ReadonlyArray<string>, todayUtc: string): string | null => {
  const head = daysDesc[0];
  if (!head) return null;
  if (head === todayUtc) return todayUtc;
  if (head === subtractDays(todayUtc, 1)) return head;
  return null;
};

export const computeStreak = (daysDesc: ReadonlyArray<string>, todayUtc: string): number => {
  const anchor = streakAnchor(daysDesc, todayUtc);
  if (anchor === null) return 0;
  return countConsecutiveDays(daysDesc, anchor);
};

export const MIN_WPM_DURATION_MS = 60_000;
export const MIN_WPM_WORDS = 50;

export const computeWpm = (words: number, durationMs: number): number => {
  if (durationMs <= 0) return 0;
  return words / (durationMs / 60_000);
};

export const isWpmEligible = (words: number, durationMs: number): boolean =>
  durationMs >= MIN_WPM_DURATION_MS && words >= MIN_WPM_WORDS;

export const primaryLanguage = (raw: string | null): string | null => {
  if (!raw) return null;
  const primary = raw.trim().toLowerCase().split(/[-_]/)[0];
  return primary && primary.length > 0 ? primary : null;
};

export const countDistinctPrimaryLanguages = (raws: ReadonlyArray<string | null>): number => {
  const set = new Set<string>();
  for (const raw of raws) {
    const p = primaryLanguage(raw);
    if (p) set.add(p);
  }
  return set.size;
};

// Bilingual should mean sustained use of two languages, not one stray foreign
// word slipping past language detection — each language must accumulate real
// volume before it counts.
export const BILINGUAL_MIN_WORDS_PER_LANGUAGE = 100;

export interface LanguageWordTotal {
  readonly language: string;
  readonly words: number;
}

export const countQualifyingLanguages = (
  totals: ReadonlyArray<LanguageWordTotal>,
  minWords: number
): number => {
  const byPrimary = new Map<string, number>();
  for (const t of totals) {
    const p = primaryLanguage(t.language);
    if (!p) continue;
    byPrimary.set(p, (byPrimary.get(p) ?? 0) + t.words);
  }
  let qualifying = 0;
  for (const words of byPrimary.values()) {
    if (words >= minWords) qualifying++;
  }
  return qualifying;
};

export const MARATHON_SESSION_WORDS = 500;

// Language identification on tiny clips is unreliable — a single word matches
// many languages — so a transcription only contributes its detected language to
// language stats (e.g. the bilingual badge) once it clears a minimum size.
export const MIN_WORDS_FOR_LANGUAGE_STAT = 3;
export const MIN_DURATION_MS_FOR_LANGUAGE_STAT = 1500;

export const languageForUsageStat = (
  detectedLanguage: string | null | undefined,
  wordCount: number,
  durationMs: number
): string | null =>
  detectedLanguage &&
  wordCount >= MIN_WORDS_FOR_LANGUAGE_STAT &&
  durationMs >= MIN_DURATION_MS_FOR_LANGUAGE_STAT
    ? detectedLanguage
    : null;

export const OUTROS_HOST_NAME = "Outros";
export const UNCATEGORIZED_CATEGORY = "uncategorized";

export const deriveDisplayName = (registryHit: AppRegistryEntry | null): DisplayNameResult => {
  if (registryHit) {
    return { hostName: registryHit.hostName, category: registryHit.category };
  }
  return { hostName: OUTROS_HOST_NAME, category: UNCATEGORIZED_CATEGORY };
};

export const evaluateMilestoneCrossings = (
  prevTotal: number,
  newTotal: number
): ReadonlyArray<MilestoneCrossing> => {
  const out: Array<MilestoneCrossing> = [];
  for (const key of MILESTONE_KEYS) {
    const threshold = MILESTONE_THRESHOLDS[key];
    if (prevTotal < threshold && newTotal >= threshold) {
      out.push({ key, contextJson: JSON.stringify({ totalWords: newTotal }) });
    }
  }
  return out;
};

const wordsForWpm = (e: { wordCount: number; inputWordCount: number | null }) =>
  e.inputWordCount ?? e.wordCount;

const FIRST_TRANSCRIPTION: AchievementRule = {
  key: "first_transcription",
  evaluate: (snap) => (snap.successEntryCount === 1 ? { contextJson: null } : null),
  progress: (snap) => ({
    current: Math.min(snap.successEntryCount, 1),
    target: 1,
    label: "transcriptions",
  }),
};

const STREAK_7: AchievementRule = {
  key: "streak_7",
  evaluate: (snap) =>
    snap.currentStreak >= 7
      ? { contextJson: JSON.stringify({ streak: snap.currentStreak, asOf: snap.todayUtc }) }
      : null,
  progress: (snap) => ({ current: snap.currentStreak, target: 7, label: "days" }),
};

const STREAK_30: AchievementRule = {
  key: "streak_30",
  evaluate: (snap) =>
    snap.currentStreak >= 30
      ? { contextJson: JSON.stringify({ streak: snap.currentStreak, asOf: snap.todayUtc }) }
      : null,
  progress: (snap) => ({ current: snap.currentStreak, target: 30, label: "days" }),
};

const STREAK_90: AchievementRule = {
  key: "streak_90",
  evaluate: (snap) =>
    snap.currentStreak >= 90
      ? { contextJson: JSON.stringify({ streak: snap.currentStreak, asOf: snap.todayUtc }) }
      : null,
  progress: (snap) => ({ current: snap.currentStreak, target: 90, label: "days" }),
};

const DAILY_1K: AchievementRule = {
  key: "daily_1k_words",
  evaluate: (snap) =>
    snap.todayWordCountUtc >= 1000
      ? {
          contextJson: JSON.stringify({
            date: snap.todayUtc,
            wordCount: snap.todayWordCountUtc,
          }),
        }
      : null,
  progress: (snap) => ({ current: snap.todayWordCountUtc, target: 1000, label: "words today" }),
};

const DAILY_3K: AchievementRule = {
  key: "daily_3k_words",
  evaluate: (snap) =>
    snap.todayWordCountUtc >= 3000
      ? {
          contextJson: JSON.stringify({
            date: snap.todayUtc,
            wordCount: snap.todayWordCountUtc,
          }),
        }
      : null,
  progress: (snap) => ({ current: snap.todayWordCountUtc, target: 3000, label: "words today" }),
};

const DAILY_5K: AchievementRule = {
  key: "daily_5k_words",
  evaluate: (snap) =>
    snap.todayWordCountUtc >= 5000
      ? {
          contextJson: JSON.stringify({
            date: snap.todayUtc,
            wordCount: snap.todayWordCountUtc,
          }),
        }
      : null,
  progress: (snap) => ({ current: snap.todayWordCountUtc, target: 5000, label: "words today" }),
};

const MARATHON_SESSION: AchievementRule = {
  key: "marathon_session",
  evaluate: (snap) =>
    snap.entry.wordCount >= MARATHON_SESSION_WORDS
      ? { contextJson: JSON.stringify({ wordCount: snap.entry.wordCount }) }
      : null,
  progress: (snap) => ({
    current: Math.min(snap.bestSessionWordsAllTime, MARATHON_SESSION_WORDS),
    target: MARATHON_SESSION_WORDS,
    label: "words in one session",
  }),
};

const SPEED_100WPM: AchievementRule = {
  key: "speed_100wpm",
  evaluate: (snap) => {
    const words = wordsForWpm(snap.entry);
    if (!isWpmEligible(words, snap.entry.durationMs)) return null;
    const wpm = computeWpm(words, snap.entry.durationMs);
    if (wpm < 100) return null;
    return { contextJson: JSON.stringify({ wpm: Math.round(wpm) }) };
  },
  progress: () => undefined,
};

const SPEED_130WPM: AchievementRule = {
  key: "speed_130wpm",
  evaluate: (snap) => {
    const words = wordsForWpm(snap.entry);
    if (!isWpmEligible(words, snap.entry.durationMs)) return null;
    const wpm = computeWpm(words, snap.entry.durationMs);
    if (wpm < 130) return null;
    return { contextJson: JSON.stringify({ wpm: Math.round(wpm) }) };
  },
  progress: () => undefined,
};

const APP_VARIETY_5: AchievementRule = {
  key: "app_variety_5",
  evaluate: (snap) =>
    snap.distinctAppsToday >= 5
      ? {
          contextJson: JSON.stringify({
            date: snap.todayUtc,
            count: snap.distinctAppsToday,
          }),
        }
      : null,
  progress: (snap) => ({
    current: snap.distinctAppsToday,
    target: 5,
    label: "apps today",
  }),
};

const BILINGUAL: AchievementRule = {
  key: "bilingual",
  evaluate: (snap) =>
    snap.qualifyingLanguagesAllTime >= 2
      ? { contextJson: JSON.stringify({ count: snap.qualifyingLanguagesAllTime }) }
      : null,
  progress: (snap) => ({
    current: snap.qualifyingLanguagesAllTime,
    target: 2,
    label: "languages",
  }),
};

export const SKILL_EXPLORER_THRESHOLD = 3;

const SKILL_EXPLORER: AchievementRule = {
  key: "skill_explorer",
  evaluate: (snap) =>
    snap.distinctSkillsAllTime >= SKILL_EXPLORER_THRESHOLD
      ? { contextJson: JSON.stringify({ distinctSkills: snap.distinctSkillsAllTime }) }
      : null,
  progress: (snap) => ({
    current: snap.distinctSkillsAllTime,
    target: SKILL_EXPLORER_THRESHOLD,
    label: "skills",
  }),
};

const OMNICHANNEL: AchievementRule = {
  key: "omnichannel",
  evaluate: (snap) =>
    snap.distinctPlatformsToday >= 2
      ? { contextJson: JSON.stringify({ date: snap.todayUtc }) }
      : null,
  progress: () => undefined,
};

// Keyed by AchievementKey so the type checker forces every key to have exactly one rule;
// ACHIEVEMENT_RULES derives its order from ACHIEVEMENT_KEYS, so there's no parallel list to drift.
const ACHIEVEMENT_RULE_BY_KEY: Record<AchievementKey, AchievementRule> = {
  first_transcription: FIRST_TRANSCRIPTION,
  streak_7: STREAK_7,
  daily_1k_words: DAILY_1K,
  marathon_session: MARATHON_SESSION,
  speed_100wpm: SPEED_100WPM,
  app_variety_5: APP_VARIETY_5,
  bilingual: BILINGUAL,
  streak_30: STREAK_30,
  streak_90: STREAK_90,
  daily_3k_words: DAILY_3K,
  daily_5k_words: DAILY_5K,
  speed_130wpm: SPEED_130WPM,
  skill_explorer: SKILL_EXPLORER,
  omnichannel: OMNICHANNEL,
};

export const ACHIEVEMENT_RULES: ReadonlyArray<AchievementRule> = ACHIEVEMENT_KEYS.map(
  (key) => ACHIEVEMENT_RULE_BY_KEY[key]
);
