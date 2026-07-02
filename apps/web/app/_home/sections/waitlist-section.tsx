import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

import { WaitlistForm } from "../components/waitlist-form";

export function WaitlistSection({ locale }: { locale: Locale }): React.ReactElement {
  const perks = [
    {
      title: m.home_waitlist_perk_1_title({}, { locale }),
      description: m.home_waitlist_perk_1_description({}, { locale }),
    },
    {
      title: m.home_waitlist_perk_2_title({}, { locale }),
      description: m.home_waitlist_perk_2_description({}, { locale }),
    },
    {
      title: m.home_waitlist_perk_3_title({}, { locale }),
      description: m.home_waitlist_perk_3_description({}, { locale }),
    },
  ];

  return (
    <section
      id="waitlist"
      className="border-y border-border/60 bg-[color-mix(in_oklch,var(--color-muted)_60%,var(--color-background))]"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <h2 className="text-[clamp(2rem,4.2vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-balance">
              {m.home_waitlist_title_prefix({}, { locale })}{" "}
              <span className="text-muted-foreground/85">
                {m.home_waitlist_title_suffix({}, { locale })}
              </span>
            </h2>
            <p className="mt-6 max-w-[52ch] text-base leading-[1.75] text-muted-foreground">
              {m.home_waitlist_description({}, { locale })}
            </p>

            <ul className="mt-8 grid gap-3.5">
              {perks.map((perk, i) => (
                <li
                  key={perk.title}
                  className="grid grid-cols-[auto_1fr] gap-3.5 rounded-xl border border-border bg-background px-[18px] py-4"
                >
                  <span className="font-mono text-[11px] tracking-[0.2em] text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-medium tracking-[-0.005em]">{perk.title}</h3>
                    <p className="mt-1 text-[13.5px] leading-[1.6] text-muted-foreground">
                      {perk.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <WaitlistForm locale={locale} />
        </div>
      </div>
    </section>
  );
}
