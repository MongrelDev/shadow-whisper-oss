import { useEffect, useState } from "react";

const STORAGE_KEY = "onboarding_completed";

interface OnboardingResult {
  completed: boolean | null;
  markCompleted: () => void;
  resetOnboarding: () => void;
}

export function useOnboarding(): OnboardingResult {
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      setCompleted(result[STORAGE_KEY] === true ? true : false);
    });

    const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local" || !(STORAGE_KEY in changes)) return;
      setCompleted(changes[STORAGE_KEY].newValue === true ? true : false);
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  function markCompleted() {
    setCompleted(true);
    chrome.storage.local.set({ [STORAGE_KEY]: true });
  }

  function resetOnboarding() {
    setCompleted(false);
    chrome.storage.local.set({ [STORAGE_KEY]: false });
  }

  return { completed, markCompleted, resetOnboarding };
}
