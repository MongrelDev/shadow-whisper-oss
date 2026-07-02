import { headers } from "next/headers";

import {
  assertIsLocale,
  baseLocale,
  locales,
  localizeHref,
  type Locale,
} from "~/paraglide/runtime";

export async function getCurrentLocalizedPath(): Promise<string> {
  const h = await headers();
  const raw = h.get("x-paraglide-request-url");
  if (!raw) return "/";
  try {
    return new URL(raw).pathname;
  } catch {
    return "/";
  }
}

export async function getRequestLocale(): Promise<Locale> {
  const h = await headers();
  const locale = h.get("x-paraglide-locale");
  return locale ? assertIsLocale(locale) : assertIsLocale(baseLocale);
}

export function buildLanguageAlternates(delocalizedPath: string): Record<string, string> {
  const entries = locales.map((locale): [Locale, string] => [
    locale,
    localizeHref(delocalizedPath, { locale }),
  ]);
  return {
    ...Object.fromEntries(entries),
    "x-default": localizeHref(delocalizedPath, { locale: "en" }),
  };
}

export function openGraphLocaleFor(locale: Locale): string {
  return locale === "pt-BR" ? "pt_BR" : "en_US";
}
