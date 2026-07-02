import Image from "next/image";
import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

type Platform = {
  logo: string;
  alt: string;
  name: string;
  arch: string;
  status: string;
};

export function DownloadSection({ locale }: { locale: Locale }): React.ReactElement {
  const platforms: Platform[] = [
    {
      logo: "/logos/apple.svg",
      alt: "Apple",
      name: "macOS",
      arch: m.home_download_platform_macos({}, { locale }),
      status: m.home_download_platform_status({}, { locale }),
    },
    {
      logo: "/logos/microsoft.svg",
      alt: "Microsoft",
      name: "Windows",
      arch: m.home_download_platform_windows({}, { locale }),
      status: m.home_download_platform_status({}, { locale }),
    },
    {
      logo: "/logos/linux.svg",
      alt: "Linux",
      name: "Linux",
      arch: m.home_download_platform_linux({}, { locale }),
      status: m.home_download_platform_status({}, { locale }),
    },
  ];

  return (
    <section
      id="download"
      className="border-y border-border/60 bg-[color-mix(in_oklch,var(--color-muted)_60%,var(--color-background))]"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <DownloadHeader locale={locale} />
          <PlatformList platforms={platforms} />
        </div>
      </div>
    </section>
  );
}

function DownloadHeader({ locale }: { locale: Locale }): React.ReactElement {
  return (
    <div>
      <h2 className="text-[clamp(2rem,4.2vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-balance">
        {m.home_download_title_prefix({}, { locale })}{" "}
        <span className="text-muted-foreground/85">
          {m.home_download_title_suffix({}, { locale })}
        </span>
      </h2>
      <p className="mt-6 max-w-[52ch] text-base leading-[1.75] text-muted-foreground">
        {m.home_download_description({}, { locale })}
      </p>
      <span className="mt-6 inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-[color-mix(in_oklch,var(--color-primary)_30%,var(--color-border))] bg-[color-mix(in_oklch,var(--color-primary)_4%,var(--color-background))] px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
        {m.home_download_badge({}, { locale })}
      </span>
    </div>
  );
}

function PlatformList({ platforms }: { platforms: Platform[] }): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      {platforms.map((platform, i) => (
        <div
          key={platform.name}
          className={`flex flex-wrap items-center justify-between gap-5 px-6 py-5 ${
            i === 0 ? "" : "border-t border-border/60"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <span className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-[color-mix(in_oklch,var(--color-muted)_80%,var(--color-background))]">
              <Image
                src={platform.logo}
                alt={platform.alt}
                width={20}
                height={20}
                className="h-5 w-5 opacity-75"
              />
            </span>
            <div>
              <h3 className="text-xl font-semibold tracking-[-0.015em]">{platform.name}</h3>
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {platform.arch}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-dashed border-[color-mix(in_oklch,var(--color-primary)_35%,var(--color-border))] bg-[color-mix(in_oklch,var(--color-primary)_4%,var(--color-background))] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            {platform.status}
          </span>
        </div>
      ))}
    </div>
  );
}
