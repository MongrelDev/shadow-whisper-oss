"use client";

import { useSyncExternalStore } from "react";

import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type PlatformKey = "macOS" | "Windows" | "Linux" | "Browser";

type Option = {
  label: string;
  arch: string;
};

type DownloadGroup = {
  platform: PlatformKey;
  kind: string;
  options: Option[];
};

const GROUPS: DownloadGroup[] = [
  {
    platform: "macOS",
    kind: "DMG",
    options: [
      { label: "Apple Silicon", arch: "arm64 · M1+" },
      { label: "Intel", arch: "x64" },
    ],
  },
  {
    platform: "Windows",
    kind: "Installer",
    options: [
      { label: "Windows x64", arch: "x64 · 64-bit" },
      { label: "Windows x86", arch: "x86 · 32-bit" },
    ],
  },
  {
    platform: "Linux",
    kind: "AppImage / deb",
    options: [
      { label: "AppImage", arch: "x64 · universal" },
      { label: "Debian / Ubuntu", arch: "deb · x64" },
    ],
  },
  {
    platform: "Browser",
    kind: "Extension",
    options: [
      { label: "Chrome", arch: "Chromium" },
      { label: "Firefox", arch: "WebExtension" },
      { label: "Edge", arch: "Chromium" },
    ],
  },
];

const TOTAL_VARIANTS = GROUPS.reduce((sum, group) => sum + group.options.length, 0);

function detectPlatform(): PlatformKey | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "macOS";
  if (ua.includes("win")) return "Windows";
  if (ua.includes("linux") || ua.includes("x11")) return "Linux";
  return null;
}

const subscribeToNothing = (): (() => void) => () => {};

function useDetectedPlatform(): PlatformKey | null {
  return useSyncExternalStore(subscribeToNothing, detectPlatform, () => null);
}

interface DownloadListLabels {
  heading: string;
  variants: string;
  recommended: string;
  soon: string;
  help: string;
}

export function DownloadList({ labels }: { labels: DownloadListLabels }): React.ReactElement {
  const detected = useDetectedPlatform();

  return (
    <div className="relative isolate overflow-hidden rounded-xl border border-border/70 bg-background/75 shadow-[0_30px_80px_-60px_color-mix(in_oklch,var(--color-primary)_60%,black)] backdrop-blur-sm">
      <header className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-3.5 sm:px-6">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-px w-6 bg-foreground/30" aria-hidden="true" />
          <span>{labels.heading}</span>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span className="text-foreground">{TOTAL_VARIANTS}</span> {labels.variants}
        </p>
      </header>

      <ul>
        {GROUPS.map((group, index) => {
          const isRecommended = detected === group.platform;
          return (
            <li
              key={group.platform}
              className={cn(
                "border-b border-border/60 last:border-b-0",
                isRecommended && "bg-primary/[0.03]"
              )}
            >
              <div className="flex items-baseline justify-between gap-4 px-5 pt-6 pb-3 sm:px-6">
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                    {group.platform}
                  </h3>
                </div>
                {isRecommended ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/80 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                    {labels.recommended}
                  </span>
                ) : (
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    {group.kind}
                  </span>
                )}
              </div>

              <div>
                {group.options.map((option) => (
                  <div
                    key={option.label}
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-t border-border/40 px-5 py-3.5 sm:px-6"
                  >
                    <span className="truncate text-[14.5px] font-medium text-foreground">
                      {option.label}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {option.arch}
                    </span>
                    <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {labels.soon}
                    </span>
                  </div>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      <footer className="flex flex-col gap-1.5 border-t border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-[12.5px] text-muted-foreground">{labels.help}</p>
        <a
          href={`mailto:${siteConfig.supportEmail}`}
          className="font-mono text-[12.5px] text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          {siteConfig.supportEmail}
        </a>
      </footer>
    </div>
  );
}
