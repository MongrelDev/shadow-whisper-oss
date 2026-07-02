import { diffWords } from "diff";

export interface DiffPart {
  type: "added" | "removed" | "unchanged";
  text: string;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function normalizeForCosmeticDiff(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function computeWordDiffParts(rawText: string, formattedText: string): DiffPart[] {
  const changes = diffWords(rawText, formattedText);
  return changes.map((change) => ({
    type: change.added ? "added" : change.removed ? "removed" : "unchanged",
    text: change.value,
  }));
}

export function computeWordDiffRatio(rawText: string, formattedText: string): number {
  const totalWords = Math.max(countWords(rawText), countWords(formattedText));
  if (totalWords === 0) return 0;

  const parts = computeWordDiffParts(rawText, formattedText);
  let removed = 0;
  let added = 0;
  for (const part of parts) {
    const wc = countWords(part.text);
    if (part.type === "removed") removed += wc;
    else if (part.type === "added") added += wc;
  }

  return Math.min(Math.max(removed, added) / totalWords, 1.0);
}

export function isEligibleForCleanupDiff(rawText: string, formattedText: string): boolean {
  if (countWords(rawText) < 30 || countWords(formattedText) < 30) return false;
  if (normalizeForCosmeticDiff(rawText) === normalizeForCosmeticDiff(formattedText)) return false;
  if (computeWordDiffRatio(rawText, formattedText) < 0.15) return false;
  return true;
}
