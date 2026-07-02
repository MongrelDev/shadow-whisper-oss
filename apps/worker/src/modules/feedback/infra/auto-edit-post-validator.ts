import type { AcceptedAutoEditPair } from "../application/ports/auto-edit-validator";

const PUNCTUATION = /[.,;:!?"'`()[\]{}<>«»…—–]/g;

const normalize = (token: string): string => token.toLowerCase().replace(PUNCTUATION, "").trim();

const tokenSet = (text: string): Set<string> => {
  const set = new Set<string>();
  for (const raw of text.split(/\s+/)) {
    const t = normalize(raw);
    if (t.length > 0) set.add(t);
  }
  return set;
};

export const filterHallucinatedAccepted = (
  accepted: ReadonlyArray<AcceptedAutoEditPair>,
  originalText: string,
  editedText: string
): AcceptedAutoEditPair[] => {
  const originalTokens = tokenSet(originalText);
  const editedTokens = tokenSet(editedText);
  return accepted.filter((pair) => {
    const fromN = normalize(pair.from);
    const toN = normalize(pair.to);
    if (fromN.length === 0 || toN.length === 0) return false;
    return originalTokens.has(fromN) && editedTokens.has(toN);
  });
};
