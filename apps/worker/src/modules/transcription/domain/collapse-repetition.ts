// Whisper-family STT engines occasionally lock into a decoding loop and emit the
// same word or phrase many times over ("thank you thank you thank you…", or the
// CJK "谢谢观看谢谢观看…"). The ai-whisper engine sets a decoder-level guard
// (hallucination_silence_threshold), but the other STT engines (Groq, AssemblyAI,
// GPT-4o) have none — so we collapse runs deterministically on the transcript
// itself, as a cross-engine safety net, before the text reaches the cleanup LLM
// (a loop derails the small model) or the user.

// A block must repeat at least this many times to be treated as a hallucinated run,
// so ordinary emphatic speech ("no no no", "very very good") survives untouched.
const MIN_REPEATS = 6;

// Upper bound on the length of the smallest repeating unit we detect. Bounds the
// backreference scan and keeps us from collapsing large legitimately-similar spans.
const MAX_UNIT_LENGTH = 100;

// Whitespace-separated word/phrase loops: a unit, then MIN_REPEATS-1+ further copies
// each introduced by whitespace. Keeping the separator *between* copies (rather than
// baking a trailing space into the unit) means the final copy needs no trailing
// separator, so the whole run collapses with no leftover tail. `s` lets a unit span
// newlines; the lazy body finds the shortest repeating phrase.
const SPACED_RUN = new RegExp(
  `(\\S.{0,${MAX_UNIT_LENGTH - 1}}?)(?:\\s+\\1){${MIN_REPEATS - 1},}`,
  "gs"
);

// Contiguous loops with no separator between copies (e.g. the CJK "谢谢观看谢谢观看…").
const CONTIGUOUS_RUN = new RegExp(`(.{1,${MAX_UNIT_LENGTH}}?)\\1{${MIN_REPEATS - 1},}`, "gs");

export const collapseRepeatedRuns = (text: string): string =>
  text.replace(SPACED_RUN, "$1").replace(CONTIGUOUS_RUN, "$1");
