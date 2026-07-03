import Link from "next/link";

import { getLocale, locales, localizeHref, type Locale } from "~/paraglide/runtime";
import { m } from "~/paraglide/messages";
import { cn } from "@/lib/utils";

const LOCALE_LABELS: Record<Locale, () => string> = {
  en: () => m.language_english(),
  "pt-BR": () => m.language_portuguese(),
};

interface LocaleSwitcherProps {
  currentPath: string;
  currentLocale?: Locale;
  className?: string;
}

export function LocaleSwitcher({
  currentPath,
  currentLocale,
  className,
}: LocaleSwitcherProps): React.ReactElement {
  const current = currentLocale ?? getLocale();
  return (
    <nav
      aria-label="Language"
      className={cn(
        "flex items-center gap-1 text-[12px] font-medium text-muted-foreground",
        className
      )}
    >
      {locales.map((locale, index) => (
        <div key={locale} className="flex items-center gap-1">
          {index > 0 && (
            <span aria-hidden="true" className="text-border">
              /
            </span>
          )}
          <Link
            href={localizeHref(currentPath, { locale })}
            prefetch={false}
            hrefLang={locale}
            aria-current={locale === current ? "page" : undefined}
            className={cn(
              "transition-colors hover:text-foreground",
              locale === current && "text-foreground"
            )}
          >
            {LOCALE_LABELS[locale]()}
          </Link>
        </div>
      ))}
    </nav>
  );
}
