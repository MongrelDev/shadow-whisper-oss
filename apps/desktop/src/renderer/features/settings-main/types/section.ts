export const SETTINGS_SECTIONS = [
  "account",
  "appearance",
  "languages",
  "recording",
  "shortcuts",
  "learning",
  "about",
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export const DEFAULT_SETTINGS_SECTION: SettingsSection = "account";
