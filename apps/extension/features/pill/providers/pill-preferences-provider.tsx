import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getLocale, setLocale as setParaglideLocale, type Locale } from "~/paraglide/runtime";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const PREFS_STORAGE_KEY = "prefs";

function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "pt-BR";
}

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readPrefs(callback: (prefs: Record<string, unknown>) => void): void {
  chrome.storage.local.get(PREFS_STORAGE_KEY, (result) => {
    callback((result[PREFS_STORAGE_KEY] as Record<string, unknown> | undefined) ?? {});
  });
}

type PrefsAppliers = {
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
};

function applyPrefs(prefs: Record<string, unknown> | undefined, appliers: PrefsAppliers): void {
  if (isLocale(prefs?.locale)) {
    setParaglideLocale(prefs.locale, { reload: false });
    appliers.setLocale(prefs.locale);
  }
  if (isTheme(prefs?.theme)) {
    appliers.setTheme(prefs.theme);
  }
}

export function PillPreferencesProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [locale, setLocale] = useState<Locale>(() => getLocale());
  const [theme, setTheme] = useState<Theme>("system");
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => resolveTheme("system"));

  useEffect(() => {
    const appliers: PrefsAppliers = { setLocale, setTheme };
    readPrefs((prefs) => applyPrefs(prefs, appliers));

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area !== "local" || !changes[PREFS_STORAGE_KEY]) return;
      applyPrefs(
        changes[PREFS_STORAGE_KEY].newValue as Record<string, unknown> | undefined,
        appliers
      );
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setSystemTheme(resolveTheme("system"));
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const className = useMemo(() => `shadow-whisper-pill-root ${resolvedTheme}`, [resolvedTheme]);

  return (
    <div className={className} lang={locale}>
      {children}
    </div>
  );
}
