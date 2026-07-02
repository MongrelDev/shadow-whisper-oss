import type { Locale } from "~/paraglide/runtime";

import { isSiteLaunched } from "@/lib/launch-state";

import { StructuredData } from "../../_home/components/structured-data";
import { DownloadSection } from "../../_home/sections/download-section";
import { FaqSection } from "../../_home/sections/faq-section";
import { FinalCtaSection } from "../../_home/sections/final-cta-section";
import { HeroSection } from "../../_home/sections/hero-section";
import { PricingSection } from "../../_home/sections/pricing-section";
import { ProductSection } from "../../_home/sections/product-section";
import { SiteFooter } from "../../_home/sections/site-footer";
import { SiteFooterWaitlist } from "../../_home/sections/site-footer-waitlist";
import { SiteHeader } from "../../_home/sections/site-header";
import { StepsSection } from "../../_home/sections/steps-section";
import { TryItSection } from "../../_home/sections/try-it/try-it-section";
import { WaitlistSection } from "../../_home/sections/waitlist-section";
import { WhySection } from "../../_home/sections/why-section";
import { ExploreTopics } from "../_marketing/components/explore-topics";

interface HomePageProps {
  locale: Locale;
  currentPath: string;
}

export async function HomePage({
  locale,
  currentPath,
}: HomePageProps): Promise<React.ReactElement> {
  const launched = await isSiteLaunched();

  return (
    <main id="main" className="bg-background text-foreground">
      <StructuredData locale={locale} />
      <SiteHeader locale={locale} currentPath={currentPath} launched={launched} />
      <HeroSection locale={locale} launched={launched} />
      <TryItSection locale={locale} />
      <StepsSection locale={locale} />
      <WhySection locale={locale} />
      <ProductSection locale={locale} />
      <ExploreTopics
        locale={locale}
        id="use-cases"
        bordered={false}
        paddingClassName="pb-24 pt-12 lg:pb-32 lg:pt-16"
      />
      <PricingSection locale={locale} launched={launched} />
      {launched ? <DownloadSection locale={locale} /> : <WaitlistSection locale={locale} />}
      <FaqSection locale={locale} launched={launched} />
      <FinalCtaSection locale={locale} launched={launched} />
      {launched ? <SiteFooter locale={locale} /> : <SiteFooterWaitlist locale={locale} />}
    </main>
  );
}
