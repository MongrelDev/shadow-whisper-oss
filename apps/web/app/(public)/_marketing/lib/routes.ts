import type { Locale } from "~/paraglide/runtime";

export type MarketingTopic =
  | "whatsapp"
  | "email"
  | "wispr"
  | "cloudVsLocal"
  | "mac"
  | "slackBilingual"
  | "echo"
  | "scratchpad";

type RouteSlugs = { readonly en: string | null; readonly pt: string };

/**
 * Canonical, locale-specific slugs. Physical route files live in the base
 * `(marketing)` group under each slug; Paraglide serves every base route at
 * both `/<slug>` and `/pt-BR/<slug>`. The public canonical for each locale is
 * derived here so navigation, hreflang, and the sitemap stay in sync.
 */
export const MARKETING_ROUTES: Record<MarketingTopic, RouteSlugs> = {
  whatsapp: { en: "/dictate-on-whatsapp", pt: "/ditar-no-whatsapp" },
  email: { en: "/dictate-email-by-voice", pt: "/ditar-email" },
  wispr: { en: "/wispr-flow-alternative", pt: "/alternativa-ao-wispr-flow" },
  cloudVsLocal: { en: "/cloud-vs-local-dictation", pt: "/por-que-nuvem-e-nao-local" },
  mac: { en: "/best-mac-dictation-app", pt: "/melhor-app-de-ditado-para-mac" },
  slackBilingual: { en: null, pt: "/falar-portugues-escrever-ingles" },
  echo: { en: "/answers-while-you-talk", pt: "/respostas-na-hora" },
  scratchpad: { en: "/second-brain", pt: "/segundo-cerebro" },
};

export const MARKETING_TOPICS = Object.keys(MARKETING_ROUTES) as readonly MarketingTopic[];

export function homeHref(locale: Locale): string {
  return locale === "pt-BR" ? "/pt-BR/" : "/";
}

export function waitlistHref(locale: Locale): string {
  return locale === "pt-BR" ? "/pt-BR/#waitlist" : "/#waitlist";
}

/** Public href for a topic in the given locale, or null when unavailable. */
export function topicHref(locale: Locale, topic: MarketingTopic): string | null {
  const slugs = MARKETING_ROUTES[topic];
  if (locale === "pt-BR") return `/pt-BR${slugs.pt}`;
  return slugs.en;
}

export type MetadataAlternates = {
  readonly canonical: string;
  readonly languages: Record<string, string>;
};

export function buildAlternates(topic: MarketingTopic, locale: Locale): MetadataAlternates {
  const slugs = MARKETING_ROUTES[topic];
  const ptUrl = `/pt-BR${slugs.pt}`;
  const languages: Record<string, string> = { "pt-BR": ptUrl };

  if (slugs.en) {
    languages.en = slugs.en;
    languages["x-default"] = slugs.en;
  } else {
    languages["x-default"] = ptUrl;
  }

  const canonical = locale === "en" && slugs.en ? slugs.en : ptUrl;
  return { canonical, languages };
}
