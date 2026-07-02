import type { Locale } from "~/paraglide/runtime";

import type { BreadcrumbItem, FaqEntry } from "@/lib/structured-data";

import { MarketingFooter } from "../components/chrome/footer";
import { MarketingHeader } from "../components/chrome/header";
import { MarketingStructuredData } from "../lib/structured-data";

export function MarketingShell({
  locale,
  breadcrumb,
  faqs,
  children,
}: {
  locale: Locale;
  breadcrumb: readonly BreadcrumbItem[];
  faqs: readonly FaqEntry[];
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="bg-background text-foreground">
      <MarketingStructuredData breadcrumb={breadcrumb} faqs={faqs} />
      <MarketingHeader locale={locale} />
      <main id="main-content">{children}</main>
      <MarketingFooter locale={locale} />
    </div>
  );
}
