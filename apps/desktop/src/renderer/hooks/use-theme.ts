import { use } from "react";
import { ThemeContext, type Theme } from "../providers/theme-provider";

export type { Theme };

export function useTheme() {
  const context = use(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
