import { useConfig } from "@/hooks/use-config";
import { cn } from "@/lib/utils";
import { locales, type Locale } from "~/paraglide/runtime";
import { m } from "~/paraglide/messages";

const LOCALE_FLAGS: Record<Locale, { flag: string; label: () => string }> = {
  en: { flag: "🇺🇸", label: () => m.language_english() },
  "pt-BR": { flag: "🇧🇷", label: () => m.language_portuguese() },
};

interface LocaleFlagSwitcherProps {
  size?: "sm" | "md";
  className?: string;
}

export function LocaleFlagSwitcher({
  size = "md",
  className,
}: LocaleFlagSwitcherProps): React.ReactElement {
  const { config, updateConfig } = useConfig();
  const currentLocale = config.preferences.locale as Locale;

  const handleSelect = async (next: Locale) => {
    if (next === currentLocale) return;
    await updateConfig({ preferences: { locale: next } });
  };

  const dimension = size === "sm" ? "h-7 w-7 text-base" : "h-9 w-9 text-xl";

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      role="group"
      aria-label="Language"
    >
      {locales.map((locale) => {
        const info = LOCALE_FLAGS[locale];
        const selected = locale === currentLocale;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => {
              void handleSelect(locale);
            }}
            aria-label={info.label()}
            aria-pressed={selected}
            title={info.label()}
            className={cn(
              "inline-flex items-center justify-center rounded-full leading-none transition-all",
              dimension,
              selected
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "opacity-50 grayscale hover:opacity-100 hover:grayscale-0"
            )}
          >
            <span aria-hidden>{info.flag}</span>
          </button>
        );
      })}
    </div>
  );
}
