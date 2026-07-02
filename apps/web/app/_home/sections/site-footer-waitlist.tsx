import Image from "next/image";
import Link from "next/link";
import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

export function SiteFooterWaitlist({ locale }: { locale: Locale }): React.ReactElement {
  const footerLinks = [
    { href: "#why", label: m.home_nav_why({}, { locale }) },
    { href: "#features", label: m.home_nav_features({}, { locale }) },
    { href: "#pricing", label: m.home_nav_pricing({}, { locale }) },
    { href: "#waitlist", label: m.home_nav_waitlist({}, { locale }) },
    { href: "#faq", label: m.home_nav_faq({}, { locale }) },
  ];

  return (
    <footer className="border-t border-border/60 py-11 text-[13.5px] text-muted-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-6 px-6 sm:px-8 lg:px-12">
        <Link href="#top" className="flex items-center gap-2.5 text-foreground">
          <Image src="/logo-light.svg" alt="" width={22} height={22} className="dark:hidden" />
          <Image src="/logo-dark.svg" alt="" width={22} height={22} className="hidden dark:block" />
          <span className="text-[15px] font-semibold tracking-tight">Shadow Whisper</span>
        </Link>

        <nav aria-label="Footer" className="flex flex-wrap gap-5">
          {footerLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p>{m.home_footer_copy({}, { locale })}</p>
      </div>
    </footer>
  );
}
