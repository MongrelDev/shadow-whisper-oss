import { useEffect, useState } from "react";

const PREFS_KEY = "prefs";
const DEFAULT_SELECTED_LANGUAGES = ["en"];

interface ExtensionPrefs {
  selectedLanguages?: string[];
  autoOpenPanelOnHotkey?: boolean;
  defaultSkillId?: string | null;
  [key: string]: unknown;
}

interface ExtensionPreferencesResult {
  selectedLanguages: string[];
  setSelectedLanguages: (langs: string[]) => void;
  defaultSkillId: string | null;
  setDefaultSkillId: (skillId: string | null) => void;
  loading: boolean;
}

type PrefsSetters = {
  setSelectedLanguagesState: (v: string[]) => void;
  setDefaultSkillIdState: (v: string | null) => void;
  setLoading: (v: boolean) => void;
};

function applyLanguages(prefs: ExtensionPrefs | undefined, setter: (v: string[]) => void) {
  if (prefs?.selectedLanguages && prefs.selectedLanguages.length > 0) {
    setter(prefs.selectedLanguages);
  }
}

function applyDefaultSkill(prefs: ExtensionPrefs | undefined, setter: (v: string | null) => void) {
  if (prefs !== undefined && "defaultSkillId" in prefs) {
    setter(prefs.defaultSkillId ?? null);
  }
}

function applyPrefsToState(prefs: ExtensionPrefs | undefined, setters: PrefsSetters) {
  applyLanguages(prefs, setters.setSelectedLanguagesState);
  applyDefaultSkill(prefs, setters.setDefaultSkillIdState);
}

function makeStorageChangeHandler(setters: PrefsSetters) {
  return function handleStorageChange(
    changes: Record<string, chrome.storage.StorageChange>,
    area: string
  ) {
    if (area !== "local" || !changes[PREFS_KEY]) return;
    const newPrefs = changes[PREFS_KEY].newValue as ExtensionPrefs | undefined;
    applyPrefsToState(newPrefs, setters);
  };
}

function mergeAndSave(key: string, value: unknown) {
  chrome.storage.local.get(PREFS_KEY, (result) => {
    const prev = (result[PREFS_KEY] as ExtensionPrefs | undefined) ?? {};
    chrome.storage.local.set({ [PREFS_KEY]: { ...prev, [key]: value } });
  });
}

export function useExtensionPreferences(): ExtensionPreferencesResult {
  const [selectedLanguages, setSelectedLanguagesState] = useState<string[]>(
    DEFAULT_SELECTED_LANGUAGES
  );
  const [defaultSkillId, setDefaultSkillIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setters: PrefsSetters = {
      setSelectedLanguagesState,
      setDefaultSkillIdState,
      setLoading,
    };

    chrome.storage.local.get(PREFS_KEY, (result) => {
      applyPrefsToState(result[PREFS_KEY] as ExtensionPrefs | undefined, setters);
      setLoading(false);
    });

    const handleStorageChange = makeStorageChangeHandler(setters);
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  function setSelectedLanguages(langs: string[]) {
    if (langs.length === 0) return;
    setSelectedLanguagesState(langs);
    mergeAndSave("selectedLanguages", langs);
  }

  function setDefaultSkillId(skillId: string | null) {
    setDefaultSkillIdState(skillId);
    mergeAndSave("defaultSkillId", skillId);
  }

  return {
    selectedLanguages,
    setSelectedLanguages,
    defaultSkillId,
    setDefaultSkillId,
    loading,
  };
}
