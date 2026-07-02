import type { Metadata } from "next";

import { MarketingArticle } from "../../_marketing/containers/marketing-article";
import { whatsappContent } from "../../_marketing/content/whatsapp";
import { buildAlternates } from "../../_marketing/lib/routes";

const locale = "pt-BR" as const;
const content = whatsappContent[locale];

export function generateMetadata(): Metadata {
  const { canonical, languages } = buildAlternates("whatsapp", locale);
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
