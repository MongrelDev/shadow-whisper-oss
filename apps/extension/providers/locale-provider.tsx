import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getLocale, setLocale as setParaglideLocale, type Locale } from "~/paraglide/runtime";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function mergeAndSave(key: string, value: unknown) {
  chrome.storage.local.get("prefs", (result) => {
    const prefs = (result.prefs as Record<string, unknown>) ?? {};
    chrome.storage.local.set({ prefs: { ...prefs, [key]: value } });
  });
}

export function LocaleProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [locale, setLocaleState] = useState<Locale>(() => getLocale());

  useEffect(() => {
    chrome.storage.local.get("prefs", (result) => {
      const prefs = result.prefs as Record<string, unknown> | undefined;
      const saved = prefs?.locale as Locale | undefined;
      if (saved && saved !== getLocale()) {
        setParaglideLocale(saved, { reload: false });
        setLocaleState(saved);
      } else if (!saved) {
        mergeAndSave("locale", getLocale());
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => {
        if (nextLocale === locale) return;
        setParaglideLocale(nextLocale, { reload: false });
        setLocaleState(nextLocale);
        mergeAndSave("locale", nextLocale);
      },
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocalePreference(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error("useLocalePreference must be used within LocaleProvider");
  }
  return value;
}
