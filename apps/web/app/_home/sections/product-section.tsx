import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

import { ScenesCarousel } from "../components/scenes/scenes-carousel";

export function ProductSection({ locale }: { locale: Locale }): React.ReactElement {
  const stats = [
    {
      num: "4×",
      unit: m.home_product_stat_1_unit({}, { locale }),
      label: m.home_product_stat_1_label({}, { locale }),
    },
    {
      num: "<1s",
      unit: m.home_product_stat_2_unit({}, { locale }),
      label: m.home_product_stat_2_label({}, { locale }),
    },
    {
      num: "0",
      unit: m.home_product_stat_3_unit({}, { locale }),
      label: m.home_product_stat_3_label({}, { locale }),
    },
    {
      num: "100+",
      unit: m.home_product_stat_4_unit({}, { locale }),
      label: m.home_product_stat_4_label({}, { locale }),
    },
  ];

  return (
    <section id="features">
      <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-24 sm:px-8 lg:px-12 lg:pb-20 lg:pt-32">
        <div className="grid items-end gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <h2 className="text-[clamp(2rem,4.2vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-balance">
              {m.home_product_title_prefix({}, { locale })}{" "}
              <span className="text-muted-foreground/85">
                {m.home_product_title_suffix({}, { locale })}
              </span>
            </h2>
          </div>
          <p className="max-w-[52ch] text-base leading-[1.75] text-muted-foreground">
            {m.home_product_description({}, { locale })}
          </p>
        </div>

        <ScenesCarousel locale={locale} />

        <StatsStrip stats={stats} locale={locale} />
      </div>
    </section>
  );
}

function StatsStrip({
  stats,
  locale,
}: {
  stats: Array<{ num: string; unit: string; label: string }>;
  locale: Locale;
}): React.ReactElement {
  return (
    <div
      aria-label={m.home_product_stats_aria({}, { locale })}
      className="@container/stats mt-20 overflow-hidden rounded-xl border border-border bg-border"
    >
      <div className="grid grid-cols-1 gap-px @[40rem]/stats:grid-cols-2 @[64rem]/stats:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex min-h-20 flex-col gap-1 bg-background px-6 py-5 @[40rem]/stats:min-h-34 @[40rem]/stats:justify-between @[40rem]/stats:gap-6"
          >
            <div className="flex items-baseline gap-2 @[40rem]/stats:flex-col @[40rem]/stats:items-start @[40rem]/stats:gap-1.5 @[64rem]/stats:flex-row @[64rem]/stats:items-baseline @[64rem]/stats:gap-2">
              <span className="text-[28px] font-semibold leading-none tracking-[-0.03em]">
                {stat.num}
              </span>
              <span className="text-sm font-medium leading-tight tracking-[-0.01em] text-muted-foreground">
                {stat.unit}
              </span>
            </div>
            <div className="max-w-[28ch] font-mono text-[10px] leading-5 uppercase tracking-[0.2em] text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
