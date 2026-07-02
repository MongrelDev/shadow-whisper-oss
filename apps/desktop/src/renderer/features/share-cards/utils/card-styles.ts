import type { CSSProperties } from "react";

export const CARD_WIDTH = 600;
export const CARD_HEIGHT = 400;

export const CARD_BG = {
  purple: "linear-gradient(135deg, #1a1530 0%, #2a1f4e 60%, #443f8f 100%)",
  ink: "linear-gradient(160deg, #0a0a14 0%, #1a1530 60%, #2a2547 100%)",
  gold: "linear-gradient(135deg, #2a1f0e 0%, #4c3a18 50%, #8f7338 100%)",
} as const;

export const CARD_THUMB_BG = {
  purple: "#2a1f4e",
  ink: "#1a1530",
  gold: "#4c3a18",
} as const;

export const fonts = {
  sans: '"Geist Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  mono: '"Geist Mono Variable", "SF Mono", "Menlo", monospace',
} as const;

export const monoStyle: CSSProperties = { fontFamily: fonts.mono };

export const shareCardRoot: CSSProperties = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  boxSizing: "border-box",
  borderRadius: 16,
  padding: 32,
  display: "flex",
  flexDirection: "column",
  gap: 14,
  color: "#fff",
  position: "relative",
  overflow: "hidden",
  fontFamily: fonts.sans,
  boxShadow: "0 24px 60px -20px rgba(0,0,0,.6)",
};
