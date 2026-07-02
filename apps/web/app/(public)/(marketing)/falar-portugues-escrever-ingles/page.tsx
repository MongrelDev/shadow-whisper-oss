import type { Metadata } from "next";

import { MarketingArticle } from "../../_marketing/containers/marketing-article";
import { slackBilingualContent } from "../../_marketing/content/slack-bilingual";
import { buildAlternates } from "../../_marketing/lib/routes";

const locale = "pt-BR" as const;

export function generateMetadata(): Metadata {
  const { canonical, languages } = buildAlternates("slackBilingual", locale);
  return {
    title: slackBilingualContent.meta.title,
    description: slackBilingualContent.meta.description,
    alternates: { canonical, languages },
    openGraph: { locale: "pt_BR" },
  };
}

export default function Page(): React.ReactElement {
  return <MarketingArticle content={slackBilingualContent} />;
}
