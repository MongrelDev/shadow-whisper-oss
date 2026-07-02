import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_STORAGE_KEY = "theme";
const PREFS_STORAGE_KEY = "prefs";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(defaultTheme: Theme): Theme {
  if (typeof window === "undefined") return defaultTheme;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : defaultTheme;
}

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function mergeAndSaveTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  if (typeof chrome === "undefined" || !chrome.storage?.local) return;
  chrome.storage.local.get(PREFS_STORAGE_KEY, (result) => {
    const prefs = (result[PREFS_STORAGE_KEY] as Record<string, unknown> | undefined) ?? {};
    chrome.storage.local.set({ [PREFS_STORAGE_KEY]: { ...prefs, theme } });
  });
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}): React.ReactElement {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme(defaultTheme));
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage?.local) return;

    chrome.storage.local.get(PREFS_STORAGE_KEY, (result) => {
      const prefs = result[PREFS_STORAGE_KEY] as Record<string, unknown> | undefined;
      if (isTheme(prefs?.theme)) {
        localStorage.setItem(THEME_STORAGE_KEY, prefs.theme);
        setThemeState(prefs.theme);
      } else {
        mergeAndSaveTheme(theme);
      }
    });

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area !== "local" || !changes[PREFS_STORAGE_KEY]) return;
      const prefs = changes[PREFS_STORAGE_KEY].newValue as Record<string, unknown> | undefined;
      if (!isTheme(prefs?.theme)) return;
      localStorage.setItem(THEME_STORAGE_KEY, prefs.theme);
      setThemeState(prefs.theme);
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (resolved: ResolvedTheme) => {
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
      setResolvedTheme(resolved);
    };

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches ? "dark" : "light");

      const handler = (event: MediaQueryListEvent) => {
        applyTheme(event.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }

    applyTheme(theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (nextTheme) => {
        mergeAndSaveTheme(nextTheme);
        setThemeState(nextTheme);
      },
    }),
    [resolvedTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return value;
}
