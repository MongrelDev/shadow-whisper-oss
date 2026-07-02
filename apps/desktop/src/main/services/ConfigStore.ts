import { app, BrowserWindow } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { cloneDeep } from "es-toolkit";
import { USE_CASE_IDS, APP_THEMES } from "../../shared/ipc-types";
import { mergeConfig } from "../../shared/config-merge";

// ─── Zod Schema ──────────────────────────────────────────────────────────

const UseCaseIdEnum = z.enum(USE_CASE_IDS);
const ThemeEnum = z.enum(APP_THEMES);
const LocaleEnum = z.enum(["en", "pt-BR"]);
export type Locale = z.infer<typeof LocaleEnum>;

const ShortcutsSchema = z.object({
  transcription: z.string(),
  pasteLastTranscript: z.string(),
  cancelRecording: z.string(),
  viewLastDiff: z.string().default("CommandOrControl+Alt+O"),
});

const NudgeSkillDiscoverySchema = z.object({
  eligibleAt: z.string().nullable().default(null),
  lastShownAt: z.string().nullable().default(null),
  lastClickedAt: z.string().nullable().default(null),
  timesShown: z.number().default(0),
  successfulTranscriptionCount: z.number().default(0),
});

const NudgeCleanupDiffSchema = z.object({
  eligibleAt: z.string().nullable().default(null),
  lastShownAt: z.string().nullable().default(null),
  lastClickedAt: z.string().nullable().default(null),
  timesShown: z.number().default(0),
});

const NudgesSchema = z.object({
  skillDiscovery: NudgeSkillDiscoverySchema.default({
    eligibleAt: null,
    lastShownAt: null,
    lastClickedAt: null,
    timesShown: 0,
    successfulTranscriptionCount: 0,
  }),
  cleanupDiff: NudgeCleanupDiffSchema.default({
    eligibleAt: null,
    lastShownAt: null,
    lastClickedAt: null,
    timesShown: 0,
  }),
});

const PreferencesSchema = z.object({
  theme: ThemeEnum,
  locale: LocaleEnum,
  selectedLanguages: z.array(z.string()),
  launchAtLogin: z.boolean(),
  notifications: z.boolean(),
  onboardingCompleted: z.boolean(),
  seenTourSteps: z.array(z.string()).default([]),
  privacyMode: z.boolean(),
  useCases: z.array(UseCaseIdEnum),
  audio: z.object({
    enableSounds: z.boolean(),
    shouldMuteAudio: z.boolean(),
    soundFolder: z.union([z.string(), z.literal(false)]),
    inputDeviceId: z.union([z.string(), z.literal(false)]),
    outputDeviceId: z.union([z.string(), z.literal(false)]),
    localAudioRetention: z.boolean(),
  }),
});

const UiSchema = z.object({
  sidebarCollapsed: z.boolean(),
});

const SkillsSchema = z.object({
  shortcuts: z.record(z.string(), z.string()).default({}),
  successfulExecutionCount: z.number().default(0),
});

const AppConfigSchema = z.object({
  shortcuts: ShortcutsSchema,
  preferences: PreferencesSchema,
  ui: UiSchema,
  skills: SkillsSchema,
  nudges: NudgesSchema.default({
    skillDiscovery: {
      eligibleAt: null,
      lastShownAt: null,
      lastClickedAt: null,
      timesShown: 0,
      successfulTranscriptionCount: 0,
    },
    cleanupDiff: {
      eligibleAt: null,
      lastShownAt: null,
      lastClickedAt: null,
      timesShown: 0,
    },
  }),
  autoTeachEnabled: z.boolean().default(false),
});

// ─── TypeScript types (derived from Zod) ─────────────────────────────────

export type ShortcutsConfig = z.infer<typeof ShortcutsSchema>;
export type PreferencesConfig = z.infer<typeof PreferencesSchema>;
export type UiConfig = z.infer<typeof UiSchema>;
export type SkillsConfig = z.infer<typeof SkillsSchema>;
export type NudgeSkillDiscoveryConfig = z.infer<typeof NudgeSkillDiscoverySchema>;
export type NudgeCleanupDiffConfig = z.infer<typeof NudgeCleanupDiffSchema>;
export type NudgesConfig = z.infer<typeof NudgesSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AppConfigPatch = DeepPartial<AppConfig>;

// ─── Defaults ────────────────────────────────────────────────────────────

const DEFAULTS: AppConfig = {
  shortcuts: {
    transcription: "CommandOrControl+Alt+W",
    pasteLastTranscript: "CommandOrControl+Alt+V",
    cancelRecording: "Escape",
    viewLastDiff: "CommandOrControl+Alt+O",
  },
  preferences: {
    theme: "system",
    locale: "en",
    selectedLanguages: ["pt", "en"],
    launchAtLogin: false,
    notifications: true,
    onboardingCompleted: false,
    seenTourSteps: [],
    privacyMode: true,
    useCases: [],
    audio: {
      enableSounds: true,
      shouldMuteAudio: false,
      soundFolder: false,
      inputDeviceId: false,
      outputDeviceId: false,
      localAudioRetention: true,
    },
  },
  ui: {
    sidebarCollapsed: false,
  },
  skills: {
    shortcuts: {},
    successfulExecutionCount: 0,
  },
  nudges: {
    skillDiscovery: {
      eligibleAt: null,
      lastShownAt: null,
      lastClickedAt: null,
      timesShown: 0,
      successfulTranscriptionCount: 0,
    },
    cleanupDiff: {
      eligibleAt: null,
      lastShownAt: null,
      lastClickedAt: null,
      timesShown: 0,
    },
  },
  autoTeachEnabled: false,
};

// ─── File path ───────────────────────────────────────────────────────────

function getConfigPath(): string {
  return path.join(app.getPath("userData"), "app-config.json");
}

// ─── Validation ──────────────────────────────────────────────────────────

function notifyConfigCorrupt(errors: string): void {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send("config:corrupt", errors);
    }
  }
}

// ─── Public API ──────────────────────────────────────────────────────────

export function getConfig(): AppConfig {
  try {
    const raw = fs.readFileSync(getConfigPath(), "utf-8");
    const json = JSON.parse(raw) as unknown;

    // Merge with defaults (fills in any missing fields)
    const merged = mergeConfig(cloneDeep(DEFAULTS), (json as AppConfigPatch) ?? {});

    // Validate merged result
    const result = AppConfigSchema.safeParse(merged);
    if (!result.success) {
      const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      console.error("[ConfigStore] Invalid config:", errors);
      notifyConfigCorrupt(errors);
      return cloneDeep(DEFAULTS);
    }

    return result.data;
  } catch {
    // File missing or unparseable JSON — use defaults silently
    return cloneDeep(DEFAULTS);
  }
}

export function setConfig(patch: AppConfigPatch): void {
  const current = getConfig();
  const updated = mergeConfig(current, patch);
  fs.writeFileSync(getConfigPath(), JSON.stringify(updated, null, 2), "utf-8");
}

export function resetConfig(): void {
  fs.writeFileSync(getConfigPath(), JSON.stringify(DEFAULTS, null, 2), "utf-8");
}

// ─── Convenience wrappers (for HotkeyService compatibility) ─────────────

export function getShortcuts(): ShortcutsConfig {
  return getConfig().shortcuts;
}

export function setShortcut(key: keyof ShortcutsConfig, accelerator: string): void {
  setConfig({ shortcuts: { [key]: accelerator } });
}

export function getLocale(): Locale {
  return getConfig().preferences.locale;
}

export function setLocale(locale: Locale): void {
  setConfig({ preferences: { locale } });
}

export function setSkillShortcuts(shortcuts: Record<string, string>): void {
  const current = getConfig();
  const next: AppConfig = { ...current, skills: { ...current.skills, shortcuts } };
  fs.writeFileSync(getConfigPath(), JSON.stringify(next, null, 2), "utf-8");
}
