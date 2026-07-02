export type EmailLocale = "pt-BR" | "en";

const SUPPORTED: EmailLocale[] = ["pt-BR", "en"];
const DEFAULT_LOCALE: EmailLocale = "en";

export function normalizeEmailLocale(locale?: string): EmailLocale {
  if (!locale) return DEFAULT_LOCALE;
  if (SUPPORTED.includes(locale as EmailLocale)) return locale as EmailLocale;
  const prefix = locale.split("-")[0]?.toLowerCase();
  if (prefix === "pt") return "pt-BR";
  if (prefix === "en") return "en";
  return DEFAULT_LOCALE;
}

export function resolveLocaleFromRequest(request?: Request | null): EmailLocale {
  const header = request?.headers.get("Accept-Language");
  if (!header) return DEFAULT_LOCALE;
  const first = header.split(",")[0]?.trim().split(";")[0]?.trim();
  return normalizeEmailLocale(first);
}
