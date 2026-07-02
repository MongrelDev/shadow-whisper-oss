import {
  breadcrumbJsonLd,
  faqPageJsonLdFromEntries,
  type BreadcrumbItem,
  type FaqEntry,
} from "@/lib/structured-data";

function serialize(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function MarketingStructuredData({
  breadcrumb,
  faqs,
}: {
  breadcrumb: readonly BreadcrumbItem[];
  faqs: readonly FaqEntry[];
}): React.ReactElement {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(breadcrumbJsonLd(breadcrumb)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(faqPageJsonLdFromEntries(faqs)) }}
      />
    </>
  );
}
