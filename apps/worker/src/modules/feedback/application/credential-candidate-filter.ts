import type { CandidatePair } from "../application/ports/teach-workflow-client";

const TOKEN_PREFIXES = [
  "sk-",
  "ghp_",
  "gho_",
  "ghu_",
  "ghs_",
  "xoxb-",
  "xoxp-",
  "AIza",
  "AKIA",
] as const;

const TOKEN_SHAPE = /^[A-Za-z0-9_-]{20,}$/;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NUMERIC_RUN = /^\d{12,}$/;

export const looksLikeCredential = (s: string): boolean => {
  if (TOKEN_PREFIXES.some((p) => s.startsWith(p))) return true;
  if (TOKEN_SHAPE.test(s)) return true;
  if (EMAIL_SHAPE.test(s)) return true;
  if (NUMERIC_RUN.test(s)) return true;
  return false;
};

export const filterCredentialCandidates = (
  candidates: ReadonlyArray<CandidatePair>
): CandidatePair[] =>
  candidates.filter((c) => !looksLikeCredential(c.from) && !looksLikeCredential(c.to));
