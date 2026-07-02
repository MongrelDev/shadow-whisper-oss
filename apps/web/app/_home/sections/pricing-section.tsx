import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

import { resolvePricingPlans } from "@/lib/pricing";
import { PricingDisplay } from "./pricing-display";

interface PricingSectionProps {
  locale: Locale;
  launched: boolean;
}

export async function PricingSection({
  locale,
  launched,
}: PricingSectionProps): Promise<React.ReactElement> {
  const plans = await resolvePricingPlans();

  return (
    <section id="pricing" className="border-t border-border/60">
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid items-start gap-12 xl:grid-cols-[0.7fr_1.3fr] xl:gap-10">
          <PricingHeader locale={locale} launched={launched} />
          <PricingDisplay locale={locale} plans={plans} launched={launched} />
        </div>
      </div>
    </section>
  );
}

function PricingHeader({
  locale,
  launched,
}: {
  locale: Locale;
  launched: boolean;
}): React.ReactElement {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {m.home_pricing_kicker({}, { locale })}
      </p>
      <h2 className="mt-4 text-[clamp(2rem,4.2vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-balance">
        {m.home_pricing_title_prefix({}, { locale })}{" "}
        <span className="text-muted-foreground/85">
          {m.home_pricing_title_suffix({}, { locale })}
        </span>
      </h2>
      <p className="mt-6 max-w-[52ch] text-base leading-[1.75] text-muted-foreground">
        {launched ? (
          <>
            {m.home_pricing_description_prefix({}, { locale })}{" "}
            <strong className="font-semibold text-foreground">
              {m.home_pricing_description_highlight({}, { locale })}
            </strong>
            , {m.home_pricing_description_suffix({}, { locale })}
          </>
        ) : (
          <>
            {m.home_pricing_waitlist_description_prefix({}, { locale })}{" "}
            <strong className="font-semibold text-foreground">
              {m.home_pricing_waitlist_description_highlight({}, { locale })}
            </strong>{" "}
            {m.home_pricing_waitlist_description_suffix({}, { locale })}
          </>
        )}
      </p>
      <div className="mt-7 flex flex-wrap gap-2.5">
        <PromoPill>
          {launched
            ? m.home_pricing_pill_1({}, { locale })
            : m.home_pricing_waitlist_pill({}, { locale })}
        </PromoPill>
        <PromoPill>{m.home_pricing_pill_2({}, { locale })}</PromoPill>
      </div>
    </div>
  );
}

function PromoPill({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-[color-mix(in_oklch,var(--color-primary)_30%,var(--color-border))] bg-[color-mix(in_oklch,var(--color-primary)_4%,var(--color-background))] px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
      {children}
    </span>
  );
}
