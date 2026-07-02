import Link from "next/link";
import type { Locale } from "~/paraglide/runtime";

import { type MarketingTopic, topicHref } from "../../lib/routes";
import { BrandMark } from "./brand-mark";

const NAV_ORDER: readonly MarketingTopic[] = [
  "whatsapp",
  "email",
  "mac",
  "wispr",
  "cloudVsLocal",
  "slackBilingual",
  "echo",
  "scratchpad",
];

const NAV_LABELS: Record<MarketingTopic, Record<Locale, string>> = {
  whatsapp: { en: "Dictate on WhatsApp", "pt-BR": "Ditar no WhatsApp" },
  email: { en: "Dictate email", "pt-BR": "Ditar e-mail" },
  mac: { en: "Mac dictation", "pt-BR": "Ditado no Mac" },
  wispr: { en: "Wispr Flow alternative", "pt-BR": "Alternativa ao Wispr Flow" },
  cloudVsLocal: { en: "Cloud vs. local", "pt-BR": "Nuvem vs. local" },
  slackBilingual: { en: "Speak PT, write EN", "pt-BR": "Falar PT, escrever EN" },
  echo: { en: "Echo, instant answers", "pt-BR": "Echo, respostas na hora" },
  scratchpad: { en: "Scratch Pad", "pt-BR": "Scratch Pad" },
};

function footerLinks(locale: Locale): readonly { href: string; label: string }[] {
  return NAV_ORDER.flatMap((topic) => {
    const href = topicHref(locale, topic);
    if (!href) return [];
    return [{ href, label: NAV_LABELS[topic][locale] }];
  });
}

export function MarketingFooter({ locale }: { locale: Locale }): React.ReactElement {
  const navLabel = locale === "pt-BR" ? "Rodapé" : "Footer";
  const links = footerLinks(locale);

  return (
    <footer className="border-t border-border/60 py-11 text-sm text-muted-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-6 px-6 sm:px-8 lg:px-12">
        <BrandMark locale={locale} />
        <nav aria-label={navLabel} className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p>© {new Date().getFullYear()} Shadow Whisper</p>
      </div>
    </footer>
  );
}
