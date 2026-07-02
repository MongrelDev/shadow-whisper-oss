"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { LocaleSwitcherMobile } from "@/components/locale-switcher-mobile";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

import { SignUpCta } from "../components/sign-up-cta";

interface SiteHeaderProps {
  locale: Locale;
  currentPath: string;
  launched: boolean;
}

function getLocaleLabels(locale: Locale) {
  return locale === "pt-BR"
    ? {
        skip: "Pular para conteúdo",
        menuOpen: "Abrir menu",
        menuClose: "Fechar menu",
      }
    : {
        skip: "Skip to content",
        menuOpen: "Open menu",
        menuClose: "Close menu",
      };
}

export function SiteHeader({ locale, currentPath, launched }: SiteHeaderProps): React.ReactElement {
  const [mobileOpen, setMobileOpen] = useState(false);
  const labels = getLocaleLabels(locale);

  const navLinks = [
    { href: "#why", label: m.home_nav_why({}, { locale }) },
    { href: "#features", label: m.home_nav_features({}, { locale }) },
    { href: "#pricing", label: m.home_nav_pricing({}, { locale }) },
    launched
      ? { href: "#download", label: m.home_nav_download({}, { locale }) }
      : { href: "#waitlist", label: m.home_nav_waitlist({}, { locale }) },
    { href: "#faq", label: m.home_nav_faq({}, { locale }) },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring focus:outline-none"
      >
        {labels.skip}
      </a>

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-3.5 sm:px-8 lg:px-12">
        <Link href={currentPath} className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/logo-light.svg"
            alt=""
            width={22}
            height={22}
            className="dark:hidden"
            priority
          />
          <Image
            src="/logo-dark.svg"
            alt=""
            width={22}
            height={22}
            className="hidden dark:block"
            priority
          />
          <span className="text-[15px] font-semibold tracking-tight">Shadow Whisper</span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-7 text-[13px] font-medium text-muted-foreground lg:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <LocaleSwitcherMobile currentPath={currentPath} currentLocale={locale} />
          <LocaleSwitcher
            currentPath={currentPath}
            currentLocale={locale}
            className="hidden sm:flex"
          />
          <div className="hidden lg:block">
            <HeaderCta locale={locale} launched={launched} />
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? labels.menuClose : labels.menuOpen}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex size-11 items-center justify-center rounded-lg border border-border bg-background lg:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <MobileNav
        open={mobileOpen}
        navLinks={navLinks}
        locale={locale}
        launched={launched}
        onClose={() => setMobileOpen(false)}
      />
    </header>
  );
}

function HeaderCta({
  locale,
  launched,
}: {
  locale: Locale;
  launched: boolean;
}): React.ReactElement {
  if (launched) {
    return (
      <SignUpCta href="#pricing" size="sm" pendingLabel={m.home_header_cta_pending({}, { locale })}>
        {m.home_header_cta({}, { locale })}
      </SignUpCta>
    );
  }
  return (
    <a href="#waitlist" className={buttonVariants({ size: "sm" })}>
      {m.home_header_cta_waitlist({}, { locale })}
    </a>
  );
}

function MobileNav({
  open,
  navLinks,
  locale,
  launched,
  onClose,
}: {
  open: boolean;
  navLinks: Array<{ href: string; label: string }>;
  locale: Locale;
  launched: boolean;
  onClose: () => void;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "overflow-hidden border-b border-border/60 bg-background/95 backdrop-blur-md transition-all duration-250 lg:hidden",
        open ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
      )}
    >
      <nav aria-label="Mobile" className="flex flex-col gap-1 px-6 pb-6 pt-2">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {link.label}
          </a>
        ))}
        <div className="mt-2 pt-2 border-t border-border/60">
          {launched ? (
            <a
              href="#pricing"
              onClick={onClose}
              className={cn(buttonVariants({ size: "default" }), "w-full justify-center")}
            >
              {m.home_header_cta({}, { locale })}
            </a>
          ) : (
            <a
              href="#waitlist"
              onClick={onClose}
              className={cn(buttonVariants({ size: "default" }), "w-full justify-center")}
            >
              {m.home_header_cta_waitlist({}, { locale })}
            </a>
          )}
        </div>
      </nav>
    </div>
  );
}
