/** Returns the Tailwind class for a heatmap cell given total word count. */
export function getCellColor(wordCount: number): string {
  if (wordCount === 0) return "bg-muted/40";
  if (wordCount < 100) return "bg-heatmap-1";
  if (wordCount < 500) return "bg-heatmap-2";
  if (wordCount < 1500) return "bg-heatmap-3";
  return "bg-heatmap-4";
}

export const HEATMAP_PALETTE_CSS_VARS = [
  "--heatmap-1",
  "--heatmap-2",
  "--heatmap-3",
  "--heatmap-4",
] as const;
