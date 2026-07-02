// STT engines report the detected language inconsistently: Grok and Whisper
// verbose_json return an English display name ("Portuguese"), other engines a
// 2-letter ISO 639-1 code. The rest of the pipeline stores codes only.
const LANGUAGE_NAME_TO_CODE: Readonly<Record<string, string>> = {
  english: "en",
  portuguese: "pt",
  spanish: "es",
  french: "fr",
  german: "de",
  italian: "it",
  dutch: "nl",
  russian: "ru",
  japanese: "ja",
  korean: "ko",
  chinese: "zh",
  mandarin: "zh",
  arabic: "ar",
  hindi: "hi",
  turkish: "tr",
  polish: "pl",
  ukrainian: "uk",
  swedish: "sv",
  norwegian: "no",
  danish: "da",
  finnish: "fi",
  greek: "el",
  hebrew: "he",
  indonesian: "id",
  vietnamese: "vi",
  thai: "th",
  czech: "cs",
  romanian: "ro",
  hungarian: "hu",
};

export function normalizeDetectedLanguage(language: string | undefined): string | undefined {
  if (!language) return undefined;
  const lower = language.toLowerCase().trim();
  if (!lower) return undefined;
  const mapped = LANGUAGE_NAME_TO_CODE[lower];
  if (mapped) return mapped;
  // Already a code like "pt" or "pt-BR" → take the primary subtag.
  if (/^[a-z]{2,3}(-|$)/.test(lower)) return lower.split("-")[0];
  return undefined;
}
