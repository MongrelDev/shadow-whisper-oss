export interface GuestLanguage {
  code: string;
  label: string;
  flag: string;
}

export const AUTO_LANGUAGE_CODE = "auto";

const LANGUAGES: GuestLanguage[] = [
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "bg", label: "Български", flag: "🇧🇬" },
  { code: "ca", label: "Català", flag: "🇦🇩" },
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "ms", label: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "no", label: "Norsk", flag: "🇳🇴" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

export const GUEST_LANGUAGES: GuestLanguage[] = [...LANGUAGES].sort((a, b) =>
  a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
);

const SUPPORTED_CODES = new Set(GUEST_LANGUAGES.map((l) => l.code));

const REGION_TO_CODE: Record<string, string> = {
  BR: "pt",
  PT: "pt",
};

function fromRegion(region: string | undefined): string | null {
  if (!region) return null;
  const code = REGION_TO_CODE[region.toUpperCase()];
  return code && SUPPORTED_CODES.has(code) ? code : null;
}

function fromPrimary(primary: string | undefined): string | null {
  const lower = (primary ?? "").toLowerCase();
  return lower && SUPPORTED_CODES.has(lower) ? lower : null;
}

export function detectInitialLanguage(): string {
  if (typeof navigator === "undefined") return AUTO_LANGUAGE_CODE;
  const tag = navigator.language ?? "";
  if (!tag) return AUTO_LANGUAGE_CODE;
  const [primary, region] = tag.split("-");
  return fromRegion(region) ?? fromPrimary(primary) ?? AUTO_LANGUAGE_CODE;
}

export function findLanguage(code: string): GuestLanguage | null {
  return GUEST_LANGUAGES.find((l) => l.code === code) ?? null;
}
