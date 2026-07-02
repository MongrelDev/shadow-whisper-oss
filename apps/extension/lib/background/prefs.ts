const PREFS_KEY = "prefs";

export interface BackgroundPrefs {
  readonly autoOpenPanelOnHotkey: boolean;
  readonly defaultSkillId: string | null;
}

const prefs: BackgroundPrefs = {
  autoOpenPanelOnHotkey: false,
  defaultSkillId: null,
};

function applyPrefs(raw: Record<string, unknown> | undefined): void {
  Object.assign(prefs, {
    autoOpenPanelOnHotkey: raw?.autoOpenPanelOnHotkey === true,
    defaultSkillId: typeof raw?.defaultSkillId === "string" ? raw.defaultSkillId : null,
  });
}

export function getBackgroundPrefs(): BackgroundPrefs {
  return prefs;
}

export function loadPrefs(): void {
  chrome.storage.local.get(PREFS_KEY, (result) => {
    applyPrefs(result[PREFS_KEY] as Record<string, unknown> | undefined);
  });
}

export function watchPrefs(): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[PREFS_KEY]) {
      applyPrefs(changes[PREFS_KEY].newValue as Record<string, unknown> | undefined);
    }
  });
}
