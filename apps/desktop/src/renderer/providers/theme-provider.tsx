import { createContext, useEffect, useState, type ReactNode } from "react";
import type { AppTheme } from "../../shared/ipc-types";

export type Theme = AppTheme;

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

// localStorage key kept ONLY as a cache for the inline script in index.html
// that prevents flash of unstyled content before React mounts
const FLASH_CACHE_KEY = "theme";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps): React.ReactElement {
  // Use localStorage cache for instant initial render (avoids flash),
  // then sync with config.json via IPC
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    const cached = localStorage.getItem(FLASH_CACHE_KEY) as Theme | null;
    return cached ?? defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    return mediaQuery.matches ? "dark" : "light";
  });

  // Sync with config.json on mount
  useEffect(() => {
    window.api.config.get().then((result) => {
      if (result.success && result.data) {
        const configTheme = result.data.preferences.theme;
        if (configTheme && configTheme !== theme) {
          setThemeState(configTheme);
          localStorage.setItem(FLASH_CACHE_KEY, configTheme);
        }
      }
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (resolved: "light" | "dark") => {
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
      setResolvedTheme(resolved);
    };

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches ? "dark" : "light");

      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    // Update localStorage cache for flash prevention
    localStorage.setItem(FLASH_CACHE_KEY, newTheme);
    // Persist to config.json
    window.api.config.set({ preferences: { theme: newTheme } });
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
