// Deterministic, zero-latency guardrail on the model output. The model is told to
// return only the final text, but small models occasionally wrap it in a code fence,
// echo a block tag, or leak prompt scaffolding. This repairs the cheap cases and
// falls back to the raw transcript when the output looks corrupted — never another
// LLM call on the latency-critical dictation path.

const LEAK_SENTINELS = [
  "This policy always applies",
  "You are the transcription orchestrator",
  "<session_context>",
  "<execution_policy>",
  "<operations>",
  "<installed_skills>",
  "<intent_policy>",
  "<lexicon_policy>",
  "<default_cleanup>",
  "<user_memory>",
  "<snippets>",
  "## Forced skill (MANDATORY",
  "## Intent router",
] as const;

function stripCodeFence(text: string): string {
  const fence = /^```[^\n]*\n([\s\S]*?)\n```$/;
  const inner = text.match(fence)?.[1];
  return inner !== undefined ? inner.trim() : text;
}

function stripWrappingTag(text: string, tag: string): string {
  const open = `<${tag}>`;
  const close = `</${tag}>`;
  if (text.startsWith(open) && text.endsWith(close)) {
    return text.slice(open.length, text.length - close.length).trim();
  }
  return text;
}

function stripWrappingQuotes(text: string): string {
  if (text.length < 2) return text;
  const first = text[0];
  const last = text[text.length - 1];
  const isQuote = (c: string | undefined) => c === '"' || c === "'" || c === "“" || c === "”";
  if (isQuote(first) && isQuote(last) && !text.slice(1, -1).includes("\n")) {
    return text.slice(1, -1).trim();
  }
  return text;
}

function looksLeaked(text: string): boolean {
  return LEAK_SENTINELS.some((s) => text.includes(s));
}

export function sanitizeModelOutput(rawTranscript: string, candidate: string): string {
  let text = candidate.trim();
  if (text.length === 0) return rawTranscript;

  text = stripCodeFence(text);
  text = stripWrappingTag(text, "transcript");
  text = stripWrappingQuotes(text);
  text = text.trim();

  // If scaffolding leaked into the output, the cleaned text is untrustworthy — return
  // the faithful raw transcript rather than exposing prompt internals to the user.
  if (looksLeaked(text)) return rawTranscript;

  return text.length === 0 ? rawTranscript : text;
}
