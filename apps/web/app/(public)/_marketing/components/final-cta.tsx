import { ArrowRight } from "lucide-react";
import type { Locale } from "~/paraglide/runtime";

import { buttonVariants } from "@/components/ui/button";

import { waitlistHref } from "../lib/routes";

export function FinalInstallCta({
  locale,
  title,
  highlight,
  description,
  ctaLabel,
}: {
  locale: Locale;
  title: string;
  highlight?: string;
  description: string;
  ctaLabel?: string;
}): React.ReactElement {
  const fallbackLabel = locale === "pt-BR" ? "Entrar na waitlist" : "Join the waitlist";

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_100%,color-mix(in_oklch,var(--color-primary)_10%,transparent)_0%,transparent_70%)]"
      />
      <div className="relative mx-auto w-full max-w-6xl px-6 py-24 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid items-end gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
          <h2 className="max-w-[18ch] text-[clamp(2.25rem,6vw,4.25rem)] font-semibold leading-[1] tracking-[-0.035em] text-balance">
            {title}
            {highlight ? <span className="text-primary"> {highlight}</span> : null}
          </h2>
          <div className="flex flex-col gap-3.5">
            <p className="text-base leading-[1.75] text-muted-foreground">{description}</p>
            <a href={waitlistHref(locale)} className={buttonVariants({ size: "lg" })}>
              {ctaLabel ?? fallbackLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
