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
// The unit must be at least two characters: collapsing single-character runs would
// corrupt legitimate dictation such as PINs ("111111"), elongated words ("noooooo"),
// or an email local part ("aaaaaaaa@example.com").
const CONTIGUOUS_RUN = new RegExp(`(.{2,${MAX_UNIT_LENGTH}}?)\\1{${MIN_REPEATS - 1},}`, "gs");

// The single-character carve-out above only protects units of length 1; a
// multi-character unit that is really one repeated character ("--" in a rule,
// "aa" in "aaaaaaaaaaaa") or carries no letters ("12" in a dictated number,
// ".." in an ellipsis run) is legitimate content, not a decoding loop. Only
// collapse a contiguous run whose unit has at least one letter and more than
// one distinct character, so separators, numbers, and elongated words survive.
const LETTER = /\p{L}/u;

const isSingleCharUnit = (unit: string): boolean => {
  const chars = [...unit];
  return chars.every((char) => char === chars[0]);
};

const isHallucinatedUnit = (unit: string): boolean => LETTER.test(unit) && !isSingleCharUnit(unit);

export const collapseRepeatedRuns = (text: string): string =>
  text
    .replace(SPACED_RUN, "$1")
    .replace(CONTIGUOUS_RUN, (match, unit: string) => (isHallucinatedUnit(unit) ? unit : match));
