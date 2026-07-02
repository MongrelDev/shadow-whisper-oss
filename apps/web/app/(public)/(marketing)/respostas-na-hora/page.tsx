import type { Metadata } from "next";

import { MarketingArticle } from "../../_marketing/containers/marketing-article";
import { echoContent } from "../../_marketing/content/echo";
import { buildAlternates } from "../../_marketing/lib/routes";

const locale = "pt-BR" as const;
const content = echoContent[locale];

export function generateMetadata(): Metadata {
  const { canonical, languages } = buildAlternates("echo", locale);
  return {
    title: content.meta.title,
    description: content.meta.description,
    alternates: { canonical, languages },
    openGraph: { locale: "pt_BR", alternateLocale: ["en_US"] },
  };
}

export default function Page(): React.ReactElement {
  return <MarketingArticle content={content} />;
}
