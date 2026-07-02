import type { Locale } from "~/paraglide/runtime";

import { faqPageJsonLd, softwareApplicationJsonLd } from "@/lib/structured-data";

function serialize(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function StructuredData({ locale }: { locale: Locale }): React.ReactElement {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(softwareApplicationJsonLd(locale)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(faqPageJsonLd(locale)) }}
      />
    </>
  );
}
