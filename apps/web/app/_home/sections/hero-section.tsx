import { ArrowRight } from "lucide-react";
import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

import { buttonVariants } from "@/components/ui/button";

import { HeroBackground } from "../components/hero-background";
import { RecordingPillMock } from "../components/recording-pill-mock";

interface HeroSectionProps {
  locale: Locale;
  launched: boolean;
}

export function HeroSection({ locale, launched }: HeroSectionProps): React.ReactElement {
  const heroSignals = launched
    ? [
        m.home_hero_signal_1({}, { locale }),
        m.home_hero_signal_2({}, { locale }),
        m.home_hero_signal_3({}, { locale }),
      ]
    : [
        m.home_hero_waitlist_signal_1({}, { locale }),
        m.home_hero_waitlist_signal_2({}, { locale }),
        m.home_hero_waitlist_signal_3({}, { locale }),
      ];

  return (
    <section id="top" className="relative isolate overflow-hidden border-b border-border/60">
      <HeroBackground />

      <div className="relative mx-auto w-full max-w-6xl px-6 pt-40 pb-24 sm:px-8 lg:px-12 lg:pt-48 lg:pb-32">
        <HeroKicker locale={locale} launched={launched} />
        <HeroHeadline locale={locale} />
        <HeroSubcopy locale={locale} />
        <HeroCtas locale={locale} launched={launched} />

        <HeroSignals signals={heroSignals} />

        <RecordingPillMock />
        <p className="mt-7 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {m.home_hero_recording_caption({}, { locale })}{" "}
          <strong className="font-medium text-foreground">
            {m.home_hero_recording_caption_strong({}, { locale })}
          </strong>
        </p>
      </div>
    </section>
  );
}

function HeroKicker({
  locale,
  launched,
}: {
  locale: Locale;
  launched: boolean;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
      <span aria-hidden="true" className="h-px w-8 bg-foreground/30" />
      <span>
        {launched
          ? m.home_hero_kicker({}, { locale })
          : m.home_hero_waitlist_kicker({}, { locale })}
      </span>
    </div>
  );
}

function HeroHeadline({ locale }: { locale: Locale }): React.ReactElement {
  return (
    <h1 className="mt-7 max-w-[14ch] text-[clamp(3rem,8.2vw,6.25rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-balance">
      {m.home_hero_title_line_1({}, { locale })}
      <br />
      <span className="text-muted-foreground/85">{m.home_hero_title_line_2({}, { locale })}</span>
      <br />
      {m.home_hero_title_line_3({}, { locale })}
      <span className="text-primary">.</span>
    </h1>
  );
}

function HeroSubcopy({ locale }: { locale: Locale }): React.ReactElement {
  return (
    <p className="mt-7 max-w-[52ch] text-lg leading-[1.65] text-muted-foreground">
      {m.home_hero_subcopy({}, { locale })}
    </p>
  );
}

function HeroCtas({ locale, launched }: { locale: Locale; launched: boolean }): React.ReactElement {
  return (
    <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <a href={launched ? "#pricing" : "#waitlist"} className={buttonVariants({ size: "lg" })}>
        {launched
          ? m.home_hero_primary_cta({}, { locale })
          : m.home_hero_waitlist_primary_cta({}, { locale })}
        <ArrowRight className="size-4" aria-hidden="true" />
      </a>
      <a
        href="#features"
        className="group inline-flex items-center gap-2 px-1 py-2.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
      >
        {m.home_hero_secondary_cta({}, { locale })}
        <ArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </a>
    </div>
  );
}

function HeroSignals({ signals }: { signals: string[] }): React.ReactElement {
  return (
    <ul className="mt-12 max-w-[540px] space-y-2.5 border-t border-border/60 pt-6 text-[13px] leading-6 text-muted-foreground">
      {signals.map((signal) => (
        <li key={signal} className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-[9px] h-px w-4 shrink-0 bg-foreground/35" />
          <span>{signal}</span>
        </li>
      ))}
    </ul>
  );
}
