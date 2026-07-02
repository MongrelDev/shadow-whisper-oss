import { Languages, Moon, Monitor, Sun, Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { locales, type Locale } from "~/paraglide/runtime";
import { useLocalePreference } from "~/providers/locale-provider";
import { useTheme, type Theme } from "~/providers/theme-provider";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";
import { m } from "~/paraglide/messages";
import { TranscriptionLanguagesSection } from "~/features/settings/components/transcription-languages-section";
import { AccountSection } from "~/features/settings/components/account-section";
import { BillingSection } from "~/features/settings/components/billing-section";
import { useOnboarding } from "~/features/onboarding/hooks/use-onboarding";

const ARROW_FORWARD = new Set(["ArrowRight", "ArrowDown"]);
const ARROW_BACKWARD = new Set(["ArrowLeft", "ArrowUp"]);

function resolveNextIndex(key: string, idx: number, len: number): number {
  if (ARROW_FORWARD.has(key)) return (idx + 1) % len;
  if (ARROW_BACKWARD.has(key)) return (idx - 1 + len) % len;
  return -1;
}

function useRadioGroupKeyNav<T>(
  options: readonly T[],
  current: T,
  onSelect: (value: T) => void
): (e: React.KeyboardEvent) => void {
  return useCallback(
    (e: React.KeyboardEvent) => {
      const idx = options.indexOf(current);
      if (idx === -1) return;
      const next = resolveNextIndex(e.key, idx, options.length);
      if (next === -1) return;
      e.preventDefault();
      onSelect(options[next] as T);
      const buttons = e.currentTarget.querySelectorAll<HTMLElement>("[role=radio]");
      buttons[next]?.focus();
    },
    [options, current, onSelect]
  );
}

const PREFS_KEY = "prefs";

function useAutoOpenPanel(): [boolean, (value: boolean) => void] {
  const [enabled, setEnabled] = useState(true);
  const prefsRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    chrome.storage.local.get(PREFS_KEY, (result) => {
      const prefs = (result[PREFS_KEY] as Record<string, unknown> | undefined) ?? {};
      prefsRef.current = prefs;
      setEnabled(prefs.autoOpenPanelOnHotkey !== false);
    });
  }, []);

  function setAutoOpen(value: boolean): void {
    setEnabled(value);
    const updated = { ...prefsRef.current, autoOpenPanelOnHotkey: value };
    prefsRef.current = updated;
    chrome.storage.local.set({ [PREFS_KEY]: updated });
  }

  return [enabled, setAutoOpen];
}

function RecordingSection(): React.ReactElement {
  const [autoOpenPanel, setAutoOpenPanel] = useAutoOpenPanel();

  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {m.settings_recording_section()}
      </h2>
      <div className="flex items-center justify-between py-1">
        <div className="mr-4">
          <p className="text-sm text-foreground">{m.settings_auto_open_panel_label()}</p>
          <p className="text-xs text-muted-foreground">
            {m.settings_auto_open_panel_description()}
          </p>
        </div>
        <Switch
          checked={autoOpenPanel}
          onCheckedChange={setAutoOpenPanel}
          aria-label={m.settings_auto_open_panel_label()}
        />
      </div>
    </section>
  );
}

const localeLabels: Record<Locale, () => string> = {
  en: () => m.language_english(),
  "pt-BR": () => m.language_portuguese(),
};

const THEME_VALUES: readonly Theme[] = ["light", "dark", "system"] as const;

function ThemeSegment(): React.ReactElement {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; icon: typeof Sun; label: () => string }[] = [
    { value: "light", icon: Sun, label: () => m.settings_theme_light() },
    { value: "dark", icon: Moon, label: () => m.settings_theme_dark() },
    { value: "system", icon: Monitor, label: () => m.settings_theme_system() },
  ];
  const onKeyDown = useRadioGroupKeyNav(THEME_VALUES, theme, setTheme);

  return (
    <div
      className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1"
      role="radiogroup"
      aria-label={m.settings_theme_label()}
      onKeyDown={onKeyDown}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" strokeWidth={1.75} />
            {option.label()}
          </button>
        );
      })}
    </div>
  );
}

function LanguageSegment(): React.ReactElement {
  const { locale, setLocale } = useLocalePreference();
  const onKeyDown = useRadioGroupKeyNav(locales, locale, setLocale);

  return (
    <div
      className="space-y-2"
      role="radiogroup"
      aria-label={m.settings_language_label()}
      onKeyDown={onKeyDown}
    >
      {locales.map((option) => {
        const active = locale === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => setLocale(option)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
              active
                ? "border-primary/50 bg-accent text-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{localeLabels[option]()}</span>
            {active && <Check className="size-4 text-primary" strokeWidth={1.75} />}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsPage() {
  const { resetOnboarding } = useOnboarding();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-full flex-col gap-5 px-5 py-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{m.settings_title()}</h1>
        <p className="text-sm text-muted-foreground">{m.settings_subtitle()}</p>
      </div>

      <section id="appearance" className="rounded-xl border border-border bg-background p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {m.settings_appearance_section()}
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <div>
              <p className="text-sm text-foreground">{m.settings_theme_label()}</p>
              <p className="text-xs text-muted-foreground">{m.settings_theme_sublabel()}</p>
            </div>
            <ThemeSegment />
          </div>

          <div className="h-px bg-border/70" />

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Languages className="mt-0.5 size-4 text-muted-foreground" strokeWidth={1.75} />
              <div>
                <p className="text-sm text-foreground">{m.settings_language_label()}</p>
                <p className="text-xs text-muted-foreground">{m.settings_language_sublabel()}</p>
              </div>
            </div>
            <LanguageSegment />
          </div>
        </div>
      </section>

      <TranscriptionLanguagesSection />

      <RecordingSection />

      <section id="extension" className="rounded-xl border border-border bg-background p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {m.settings_extension_section()}
        </h2>
        <div className="space-y-1">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-foreground">{m.settings_mic_access_label()}</p>
              <p className="text-xs text-muted-foreground">{m.settings_mic_access_sublabel()}</p>
            </div>
            <span className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-foreground">
              {m.settings_status_managed()}
            </span>
          </div>
          <div className="h-px bg-border/70" />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-foreground">{m.settings_active_tab_label()}</p>
              <p className="text-xs text-muted-foreground">{m.settings_active_tab_sublabel()}</p>
            </div>
            <span className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-foreground">
              {m.settings_status_enabled()}
            </span>
          </div>
          <div className="h-px bg-border/70" />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-foreground">{m.settings_onboarding_label()}</p>
              <p className="text-xs text-muted-foreground">{m.settings_onboarding_sublabel()}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetOnboarding();
                void navigate({ to: "/" });
              }}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
            >
              {m.settings_onboarding_button()}
            </button>
          </div>
        </div>
      </section>

      <AccountSection />

      <BillingSection />
    </div>
  );
}
