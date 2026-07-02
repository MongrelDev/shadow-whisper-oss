import { ArrowRight } from "lucide-react";
import type { Locale } from "~/paraglide/runtime";

import { buttonVariants } from "@/components/ui/button";

import { waitlistHref } from "../lib/routes";
import type { Cta } from "../lib/types";

export function MarketingHero({
  locale,
  eyebrow,
  title,
  highlight,
  lede,
  primaryCta,
  secondaryCta,
  visual,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  highlight?: string;
  lede: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  visual?: React.ReactNode;
}): React.ReactElement {
  const primaryLabel = locale === "pt-BR" ? "Entrar na waitlist" : "Join the waitlist";
  const primary = primaryCta ?? { label: primaryLabel, href: waitlistHref(locale) };

  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_15%_0%,color-mix(in_oklch,var(--color-primary)_9%,transparent)_0%,transparent_70%)]"
      />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-12 lg:py-28">
        <div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span
              aria-hidden="true"
              className="inline-block h-0.5 w-12 rounded-full bg-primary/40"
            />
            <p className="font-mono text-[11px] uppercase tracking-[0.22em]">{eyebrow}</p>
          </div>
          <h1 className="mt-6 text-[clamp(2.25rem,5.5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-balance">
            {title}
            {highlight ? <span className="text-primary"> {highlight}</span> : null}
          </h1>
          <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.7] text-muted-foreground">
            {lede}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href={primary.href} className={buttonVariants({ size: "lg" })}>
              {primary.label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            {secondaryCta ? (
              <a
                href={secondaryCta.href}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                {secondaryCta.label}
              </a>
            ) : null}
          </div>
        </div>
        {visual ? <div className="lg:pl-4">{visual}</div> : null}
      </div>
    </section>
  );
}
