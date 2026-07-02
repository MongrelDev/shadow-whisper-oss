import { ArrowRight } from "lucide-react";
import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

import { buttonVariants } from "@/components/ui/button";

interface FinalCtaSectionProps {
  locale: Locale;
  launched: boolean;
}

export function FinalCtaSection({ locale, launched }: FinalCtaSectionProps): React.ReactElement {
  const copy = launched
    ? {
        titleLine1: m.home_final_cta_title_line_1({}, { locale }),
        titleLine2: m.home_final_cta_title_line_2({}, { locale }),
        titleHighlight: m.home_final_cta_title_highlight({}, { locale }),
        description: m.home_final_cta_description({}, { locale }),
        primaryLabel: m.home_final_cta_primary({}, { locale }),
        primaryHref: "#pricing",
      }
    : {
        titleLine1: m.home_final_cta_waitlist_title_line_1({}, { locale }),
        titleLine2: m.home_final_cta_waitlist_title_line_2({}, { locale }),
        titleHighlight: m.home_final_cta_waitlist_title_highlight({}, { locale }),
        description: m.home_final_cta_waitlist_description({}, { locale }),
        primaryLabel: m.home_final_cta_waitlist_primary({}, { locale }),
        primaryHref: "#waitlist",
      };

  return (
    <section className="relative overflow-hidden border-t border-border/60">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_100%,color-mix(in_oklch,var(--color-primary)_10%,transparent)_0%,transparent_70%)]"
      />
      <div className="relative mx-auto w-full max-w-6xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span aria-hidden="true" className="inline-block h-0.5 w-16 rounded-full bg-primary/40" />
          <p className="font-mono text-[11px] uppercase tracking-[0.22em]">
            {m.home_final_cta_kicker({}, { locale })}
          </p>
        </div>

        <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
          <h2 className="max-w-[18ch] text-[clamp(2.5rem,7vw,5rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-balance">
            {copy.titleLine1}
            <br />
            {copy.titleLine2}
            <span className="text-primary"> {copy.titleHighlight}</span>
          </h2>

          <div className="flex flex-col gap-3.5">
            <p className="text-base leading-[1.75] text-muted-foreground">{copy.description}</p>
            <div className="flex flex-col gap-2.5">
              <a href={copy.primaryHref} className={buttonVariants({ size: "lg" })}>
                {copy.primaryLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <a href="#pricing" className={buttonVariants({ variant: "outline", size: "lg" })}>
                {m.home_final_cta_secondary({}, { locale })}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
