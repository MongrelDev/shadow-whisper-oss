import type { Locale } from "~/paraglide/runtime";

import { ComparisonTable } from "../components/comparison-table";
import { ExploreTopics } from "../components/explore-topics";
import { FeatureShowcase } from "../components/feature-showcase";
import { FinalInstallCta } from "../components/final-cta";
import { MarketingFaq } from "../components/faq";
import { MarketingHero } from "../components/hero";
import { MarketingSection } from "../components/section";
import { ProseList } from "../components/prose-list";
import { UseCaseGrid } from "../components/use-case-grid";
import { homeHref, topicHref } from "../lib/routes";
import type { ContentSection, MarketingPageContent } from "../lib/types";
import { SceneShowcase } from "../visuals/showcase";
import { SceneDefs } from "../visuals/scene-defs";
import { MarketingShell } from "./marketing-shell";

function ArticleSection({
  section,
  locale,
}: {
  section: ContentSection;
  locale: Locale;
}): React.ReactElement {
  const { meta, muted } = section;

  if (section.kind === "prose") {
    return (
      <MarketingSection {...meta} muted={muted}>
        <ProseList items={section.items} variant={section.variant} />
      </MarketingSection>
    );
  }

  if (section.kind === "useCases") {
    return (
      <MarketingSection {...meta} muted={muted}>
        <UseCaseGrid items={section.items} />
      </MarketingSection>
    );
  }

  if (section.kind === "comparison") {
    return (
      <MarketingSection {...meta} muted={muted}>
        <ComparisonTable {...section.comparison} />
      </MarketingSection>
    );
  }

  return (
    <MarketingSection {...meta} muted={muted}>
      <FeatureShowcase locale={locale} scenes={section.scenes} />
    </MarketingSection>
  );
}

export function MarketingArticle({
  content,
}: {
  content: MarketingPageContent;
}): React.ReactElement {
  const { locale, topic, hero, sections, faqs, faqHeading, finalCta, breadcrumbLabel } = content;
  const selfPath = topicHref(locale, topic) ?? homeHref(locale);

  return (
    <MarketingShell
      locale={locale}
      breadcrumb={[
        { name: "Shadow Whisper", path: homeHref(locale) },
        { name: breadcrumbLabel, path: selfPath },
      ]}
      faqs={faqs}
    >
      <SceneDefs />

      <MarketingHero
        locale={locale}
        eyebrow={hero.eyebrow}
        title={hero.title}
        highlight={hero.highlight}
        lede={hero.lede}
        secondaryCta={hero.secondaryCta}
        visual={<SceneShowcase locale={locale} {...hero.scene} />}
      />

      {sections.map((section, i) => (
        <ArticleSection key={`${section.kind}-${i}`} section={section} locale={locale} />
      ))}

      <MarketingSection {...faqHeading}>
        <MarketingFaq faqs={faqs} />
      </MarketingSection>

      <ExploreTopics locale={locale} excludeTopic={topic} variant="article" />

      <FinalInstallCta
        locale={locale}
        title={finalCta.title}
        highlight={finalCta.highlight}
        description={finalCta.description}
        ctaLabel={finalCta.ctaLabel}
      />
    </MarketingShell>
  );
}
