import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

import { PLAN_PRICES } from "./pricing";
import { absoluteUrl, siteConfig } from "./site";

const CURRENCY_BY_LOCALE = {
  en: "USD",
  "pt-BR": "BRL",
} as const satisfies Record<Locale, keyof typeof PLAN_PRICES>;

function homePath(locale: Locale): string {
  return locale === "pt-BR" ? "/pt-BR/" : "/";
}

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function softwareApplicationJsonLd(locale: Locale): Record<string, unknown> {
  const currency = CURRENCY_BY_LOCALE[locale];

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "macOS, Windows, Linux",
    url: absoluteUrl(homePath(locale)),
    description: m.home_meta_description({}, { locale }),
    offers: {
      "@type": "Offer",
      price: formatPrice(PLAN_PRICES[currency].pro.monthly),
      priceCurrency: currency,
    },
  };
}

export type FaqEntry = { readonly question: string; readonly answer: string };

export function faqPageJsonLdFromEntries(entries: readonly FaqEntry[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}

export type BreadcrumbItem = { readonly name: string; readonly path: string };

export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqPageJsonLd(locale: Locale): Record<string, unknown> {
  const faqs = [
    {
      question: m.home_faq_1_question({}, { locale }),
      answer: m.home_faq_1_answer({}, { locale }),
    },
    {
      question: m.home_faq_2_question({}, { locale }),
      answer: m.home_faq_2_answer({}, { locale }),
    },
    {
      question: m.home_faq_3_question({}, { locale }),
      answer: m.home_faq_3_answer({}, { locale }),
    },
    {
      question: m.home_faq_4_question({}, { locale }),
      answer: m.home_faq_4_answer({}, { locale }),
    },
    {
      question: m.home_faq_5_question({}, { locale }),
      answer: m.home_faq_5_answer({}, { locale }),
    },
    {
      question: m.home_faq_6_question({}, { locale }),
      answer: m.home_faq_6_answer({}, { locale }),
    },
    {
      question: m.home_faq_7_question({}, { locale }),
      answer: m.home_faq_7_answer({}, { locale }),
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
