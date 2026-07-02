import type { ReactNode } from "react";
import type { Locale } from "~/paraglide/runtime";

import type { MarketingTopic } from "./routes";

export type Cta = { readonly label: string; readonly href: string };

export type ComparisonColumn = {
  readonly label: string;
  readonly name: string;
  readonly highlight?: boolean;
};

export type ComparisonRow = {
  readonly criterion: string;
  readonly cells: readonly ReactNode[];
};

export type Comparison = {
  readonly ariaLabel: string;
  readonly criterionLabel: string;
  readonly columns: readonly ComparisonColumn[];
  readonly rows: readonly ComparisonRow[];
};

export type UseCase = {
  readonly tag: string;
  readonly title: string;
  readonly description: string;
};

export type Faq = { readonly question: string; readonly answer: string };

export type SectionMeta = {
  readonly kicker?: string;
  readonly title?: string;
  readonly description?: string;
};

export type SceneKey =
  | "auto-typing"
  | "clean-up"
  | "diff"
  | "snippets"
  | "email"
  | "whatsapp"
  | "echo"
  | "scratchpad";

export type SceneCaption = {
  readonly scene: SceneKey;
  readonly kicker: string;
  readonly title: string;
  readonly description: string;
};

export type PageMeta = {
  readonly title: string;
  readonly description: string;
};

/** The variable middle of a marketing page, rendered in order by the article. */
export type ContentSection =
  | {
      readonly kind: "prose";
      readonly meta: SectionMeta;
      readonly muted?: boolean;
      readonly variant?: "numbered";
      readonly items: readonly string[];
    }
  | {
      readonly kind: "useCases";
      readonly meta: SectionMeta;
      readonly muted?: boolean;
      readonly items: readonly UseCase[];
    }
  | {
      readonly kind: "comparison";
      readonly meta: SectionMeta;
      readonly muted?: boolean;
      readonly comparison: Comparison;
    }
  | {
      readonly kind: "showcase";
      readonly meta: SectionMeta;
      readonly muted?: boolean;
      readonly scenes: readonly SceneCaption[];
    };

export type HeroContent = {
  readonly eyebrow: string;
  readonly title: string;
  readonly highlight?: string;
  readonly lede: string;
  readonly secondaryCta?: Cta;
  readonly scene: SceneCaption;
};

/**
 * A marketing page's full localized copy. One generic article container renders
 * this; route files only pick the locale and read `meta` for the document head.
 */
export type MarketingPageContent = {
  readonly topic: MarketingTopic;
  readonly locale: Locale;
  readonly meta: PageMeta;
  readonly breadcrumbLabel: string;
  readonly hero: HeroContent;
  readonly sections: readonly ContentSection[];
  readonly faqs: readonly Faq[];
  readonly faqHeading: SectionMeta;
  readonly finalCta: {
    readonly title: string;
    readonly highlight?: string;
    readonly description: string;
    readonly ctaLabel?: string;
  };
};

export type LocalizedContent = Record<Locale, MarketingPageContent>;
