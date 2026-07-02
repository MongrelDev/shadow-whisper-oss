import type { Metadata } from "next";

import { MarketingArticle } from "../../_marketing/containers/marketing-article";
import { macContent } from "../../_marketing/content/mac";
import { buildAlternates } from "../../_marketing/lib/routes";

const locale = "en" as const;
const content = macContent[locale];

export function generateMetadata(): Metadata {
  const { canonical, languages } = buildAlternates("mac", locale);
  return {
    title: content.meta.title,
    description: content.meta.description,
    alternates: { canonical, languages },
    openGraph: { locale: "en_US", alternateLocale: ["pt_BR"] },
  };
}

export default function Page(): React.ReactElement {
  return <MarketingArticle content={content} />;
}
