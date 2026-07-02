import type { Locale } from "~/paraglide/runtime";

import { buttonVariants } from "@/components/ui/button";

import { waitlistHref } from "../../lib/routes";
import { BrandMark } from "./brand-mark";

export function MarketingHeader({ locale }: { locale: Locale }): React.ReactElement {
  const skipLabel = locale === "pt-BR" ? "Pular para conteúdo" : "Skip to content";
  const waitlistLabel = locale === "pt-BR" ? "Entrar na waitlist" : "Join the waitlist";

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring focus:outline-none"
      >
        {skipLabel}
      </a>

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-3.5 sm:px-8 lg:px-12">
        <BrandMark locale={locale} />
        <a href={waitlistHref(locale)} className={buttonVariants({ size: "sm" })}>
          {waitlistLabel}
        </a>
      </div>
    </header>
  );
}
