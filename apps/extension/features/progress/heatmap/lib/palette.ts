/** Returns Tailwind classes for a heatmap cell given total word count (ADR 0002 §18). */
export function getCellColor(wordCount: number): string {
  if (wordCount === 0) return "bg-muted/10 border border-border/20";
  if (wordCount < 100) return "bg-[#2a2548] border border-[#3a3468]";
  if (wordCount < 500) return "bg-[#443f8f]";
  if (wordCount < 1500) return "bg-[#887dcf]";
  return "bg-[#b8a9f0]";
}

export const HEATMAP_PALETTE_HEX = ["#2a2548", "#443f8f", "#887dcf", "#b8a9f0"] as const;
