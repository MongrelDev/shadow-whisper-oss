export const ONBOARDING_STEPS = [
  "welcome",
  "permissions",
  "shortcut",
  "skills",
  "plan",
  "done",
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

export function isOnboardingStep(value: unknown): value is OnboardingStepId {
  return typeof value === "string" && (ONBOARDING_STEPS as readonly string[]).includes(value);
}

export const ONBOARDING_TOTAL_VISIBLE = 6;

export interface ShortcutPreset {
  id: string;
  label: string;
  accelerator: string;
}

export const SHORTCUT_PRESETS: ShortcutPreset[] = [
  { id: "cmd-shift-alt-w", label: "⌘ ⇧ ⌥ W", accelerator: "CommandOrControl+Shift+Alt+W" },
  { id: "cmd-alt-w", label: "⌘ ⌥ W", accelerator: "CommandOrControl+Alt+W" },
  { id: "ctrl-space", label: "⌃ Space", accelerator: "Control+Space" },
  { id: "alt-space", label: "⌥ Space", accelerator: "Alt+Space" },
];
