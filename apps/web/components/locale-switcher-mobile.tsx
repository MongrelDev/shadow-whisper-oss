"use client";

import { useState } from "react";
import { Check, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { locales, localizeHref, type Locale } from "~/paraglide/runtime";
import { m } from "~/paraglide/messages";

const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇺🇸",
  "pt-BR": "🇧🇷",
};

const LOCALE_LABELS: Record<Locale, () => string> = {
  en: () => m.language_english(),
  "pt-BR": () => m.language_portuguese(),
};

interface LocaleSwitcherMobileProps {
  currentPath: string;
  currentLocale: Locale;
}

export function LocaleSwitcherMobile({
  currentPath,
  currentLocale,
}: LocaleSwitcherMobileProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="flex sm:hidden h-9 w-9"
          aria-label="Change language"
        >
          <Globe className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-48 p-1.5">
        <div className="flex flex-col gap-0.5">
          {locales.map((locale) => {
            const isActive = locale === currentLocale;
            return (
              <a
                key={locale}
                href={localizeHref(currentPath, { locale })}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                )}
              >
                <span aria-hidden>{LOCALE_FLAGS[locale]}</span>
                <span>{LOCALE_LABELS[locale]()}</span>
                {isActive && <Check className="ml-auto h-4 w-4 text-primary" />}
              </a>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
