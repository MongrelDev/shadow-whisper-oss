import Image from "next/image";
import Link from "next/link";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { LocaleSwitcherMobile } from "@/components/locale-switcher-mobile";
import { cn } from "@/lib/utils";
import { getLocale, localizeHref } from "~/paraglide/runtime";

interface PublicShellProps {
  children: React.ReactNode;
  eyebrow?: string;
  className?: string;
  currentPath: string;
}

function getSkipLabel(): string {
  return getLocale() === "pt-BR" ? "Pular para conteúdo" : "Skip to content";
}

export function PublicShell({
  children,
  eyebrow = "Shadow Whisper",
  className,
  currentPath,
}: PublicShellProps): React.ReactElement {
  const currentLocale = getLocale();
  return (
    <main className={cn("min-h-screen bg-background text-foreground", className)}>
      <a
        href="#public-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring focus:outline-none"
      >
        {getSkipLabel()}
      </a>

      <section className="relative isolate min-h-screen overflow-hidden px-6 py-8 sm:px-10 lg:px-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(50%_40%_at_50%_30%,color-mix(in_oklch,var(--color-primary)_8%,transparent)_0%,transparent_70%)]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-background/95" />

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col">
          <header className="flex items-center justify-between gap-6">
            <Link
              href={localizeHref("/", { locale: currentLocale })}
              prefetch={false}
              className="flex items-center gap-3"
            >
              <span className="flex size-9 items-center justify-center rounded-md bg-background/75">
                <Image
                  src="/logo-light.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="dark:hidden"
                  priority
                />
                <Image
                  src="/logo-dark.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="hidden dark:block"
                  priority
                />
              </span>
              <span className="text-sm font-semibold tracking-tight">Shadow Whisper</span>
            </Link>
            <div className="flex items-center gap-4">
              <LocaleSwitcherMobile currentPath={currentPath} currentLocale={currentLocale} />
              <LocaleSwitcher currentPath={currentPath} className="hidden sm:flex" />
              <span className="rounded-md border border-border bg-background/75 px-3 py-1 text-xs font-medium text-muted-foreground">
                {eyebrow}
              </span>
            </div>
          </header>

          <div id="public-content">{children}</div>
        </div>
      </section>
    </main>
  );
}
