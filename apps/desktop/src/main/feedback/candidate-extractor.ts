/**
 * Ported from OpenWhispr's correctionLearner.js (MIT-licensed).
 * Source: https://github.com/openwhispr/openwhispr/blob/main/src/utils/correctionLearner.js
 *
 * Adapts the upstream extractor to return an explicit ExtractResult discriminated
 * union so the auto-teach orchestrator can distinguish skip reasons from
 * candidate pairs and decide whether to escalate to the server.
 */

export interface CandidatePair {
  from: string;
  to: string;
}

export type ExtractResult =
  | { kind: "skip"; reason: SkipReason }
  | { kind: "send"; candidates: CandidatePair[] };

export type SkipReason =
  | "empty"
  | "identical"
  | "continuation"
  | "no_diff_region"
  | "rewrite"
  | "no_candidates";

const CONTINUATION_LENGTH_MULTIPLIER = 3;
const FIELD_REGION_LENGTH_MULTIPLIER = 1.5;
const REGION_OVERLAP_THRESHOLD = 0.3;
const REWRITE_RATIO = 0.5;
const MIN_CANDIDATE_LENGTH = 3;
const EDIT_DISTANCE_RATIO_LIMIT = 0.65;

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    const row = dp[i]!;
    const prevRow = dp[i - 1]!;
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        row[j] = prevRow[j - 1]!;
      } else {
        row[j] = 1 + Math.min(prevRow[j]!, row[j - 1]!, prevRow[j - 1]!);
      }
    }
  }
  return dp[m]![n]!;
}

function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}_]+|[^\p{L}\p{N}_]+$/gu, ""))
    .filter((w) => w.length > 0);
}

// eslint-disable-next-line complexity -- verbatim port of upstream sliding-window region detection
function findEditedRegion(originalText: string, fieldValue: string): string {
  if (fieldValue.length <= originalText.length * FIELD_REGION_LENGTH_MULTIPLIER) {
    return fieldValue;
  }

  const idx = fieldValue.indexOf(originalText);
  if (idx !== -1) {
    return originalText;
  }

  const origWords = tokenize(originalText);
  const fieldWords = tokenize(fieldValue);
  const windowSize = origWords.length;

  if (fieldWords.length <= windowSize) {
    return fieldValue;
  }

  let bestStart = 0;
  let bestScore = -1;

  for (let i = 0; i <= fieldWords.length - windowSize; i++) {
    let matches = 0;
    for (let j = 0; j < windowSize; j++) {
      if (fieldWords[i + j]!.toLowerCase() === origWords[j]!.toLowerCase()) {
        matches++;
      }
    }
    if (matches > bestScore) {
      bestScore = matches;
      bestStart = i;
    }
  }

  if (bestScore < windowSize * REGION_OVERLAP_THRESHOLD) {
    return fieldValue;
  }

  return fieldWords.slice(bestStart, bestStart + windowSize).join(" ");
}

// eslint-disable-next-line complexity -- verbatim port of upstream LCS alignment + sub detection
function findSubstitutions(origWords: string[], editedWords: string[]): Array<[string, string]> {
  const m = origWords.length;
  const n = editedWords.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    const row = dp[i]!;
    const prevRow = dp[i - 1]!;
    for (let j = 1; j <= n; j++) {
      if (origWords[i - 1]!.toLowerCase() === editedWords[j - 1]!.toLowerCase()) {
        row[j] = prevRow[j - 1]! + 1;
      } else {
        row[j] = Math.max(prevRow[j]!, row[j - 1]!);
      }
    }
  }

  const aligned: Array<[string | null, string | null]> = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i - 1]!.toLowerCase() === editedWords[j - 1]!.toLowerCase()) {
      aligned.unshift([origWords[i - 1]!, editedWords[j - 1]!]);
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      aligned.unshift([null, editedWords[j - 1]!]);
      j--;
    } else {
      aligned.unshift([origWords[i - 1]!, null]);
      i--;
    }
  }

  const subs: Array<[string, string]> = [];
  for (let k = 0; k < aligned.length - 1; k++) {
    const current = aligned[k]!;
    const next = aligned[k + 1]!;
    const [origW, editW] = current;
    const [nextOrigW, nextEditW] = next;

    if (origW !== null && editW === null && nextOrigW === null && nextEditW !== null) {
      subs.push([origW, nextEditW]);
    }
  }

  return subs;
}

// eslint-disable-next-line complexity -- skip-reason taxonomy + per-candidate filters; splitting hides the pipeline
export function extractCandidates(
  originalText: string,
  editedText: string,
  userDictionary: ReadonlySet<string>
): ExtractResult {
  if (!originalText || !editedText) {
    return { kind: "skip", reason: "empty" };
  }
  if (originalText === editedText) {
    return { kind: "skip", reason: "identical" };
  }
  if (editedText.length > originalText.length * CONTINUATION_LENGTH_MULTIPLIER) {
    return { kind: "skip", reason: "continuation" };
  }

  const editedRegion = findEditedRegion(originalText, editedText);
  if (editedRegion === originalText) {
    return { kind: "skip", reason: "no_diff_region" };
  }

  const origWords = tokenize(originalText);
  const editedWords = tokenize(editedRegion);

  if (origWords.length === 0 || editedWords.length === 0) {
    return { kind: "skip", reason: "no_candidates" };
  }

  const subs = findSubstitutions(origWords, editedWords);
  if (subs.length > origWords.length * REWRITE_RATIO) {
    return { kind: "skip", reason: "rewrite" };
  }

  const seenCorrections = new Set<string>();
  const candidates: CandidatePair[] = [];

  for (const [origWord, correctedWord] of subs) {
    const normalizedCorrected = correctedWord.toLowerCase();

    if (userDictionary.has(normalizedCorrected)) continue;
    if (seenCorrections.has(normalizedCorrected)) continue;
    if (origWord.toLowerCase() === normalizedCorrected) continue;
    if (correctedWord.length < MIN_CANDIDATE_LENGTH) continue;

    const dist = editDistance(origWord.toLowerCase(), normalizedCorrected);
    const maxLen = Math.max(origWord.length, correctedWord.length);
    if (dist / maxLen > EDIT_DISTANCE_RATIO_LIMIT) continue;

    candidates.push({ from: origWord, to: correctedWord });
    seenCorrections.add(normalizedCorrected);
  }

  if (candidates.length === 0) {
    return { kind: "skip", reason: "no_candidates" };
  }

  return { kind: "send", candidates };
}
