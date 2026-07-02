import { cn } from "@/lib/utils";
import { useConfig, DEFAULT_PREFERENCES } from "@/hooks/use-config";
import { AVAILABLE_LANGUAGES } from "@/lib/languages";
import { LocaleFlagSwitcher } from "@/components/locale-flag-switcher";
import { SettingsCard, Row, RestoreButton } from "./settings-primitives";
import { m } from "~/paraglide/messages";

export function LanguagesSection(): React.ReactElement {
  const { config, updateConfig } = useConfig();
  const selectedLanguages = config.preferences.selectedLanguages;
  const defaultLanguages = DEFAULT_PREFERENCES.selectedLanguages;
  const isDefaultLanguages =
    selectedLanguages.length === defaultLanguages.length &&
    selectedLanguages.every((lang) => defaultLanguages.includes(lang));

  const toggle = (code: string) => {
    if (selectedLanguages.includes(code)) {
      if (selectedLanguages.length > 1) {
        updateConfig({
          preferences: { selectedLanguages: selectedLanguages.filter((s) => s !== code) },
        });
      }
    } else {
      updateConfig({ preferences: { selectedLanguages: [...selectedLanguages, code] } });
    }
  };

  return (
    <SettingsCard>
      <Row label={m.settings_languages_app_label()} sublabel={m.settings_languages_app_sublabel()}>
        <LocaleFlagSwitcher />
      </Row>

      <div className="border-t border-border my-2" />

      <div className="pt-3">
        <p className="text-base text-foreground">{m.settings_languages_transcription_label()}</p>
        <p className="text-sm text-muted-foreground mt-0.5 mb-3">
          {selectedLanguages.length === 1
            ? m.settings_languages_transcription_single()
            : m.settings_languages_transcription_multiple()}
        </p>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_LANGUAGES.map((lang) => {
            const isSelected = selectedLanguages.includes(lang.code);
            return (
              <button
                key={lang.code}
                onClick={() => toggle(lang.code)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all",
                  isSelected
                    ? "bg-violet text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
        <Row
          label={m.settings_languages_restore_label()}
          sublabel={m.settings_languages_restore_sublabel()}
        >
          <RestoreButton
            onClick={() =>
              updateConfig({
                preferences: { selectedLanguages: defaultLanguages },
              })
            }
            disabled={isDefaultLanguages}
          />
        </Row>
      </div>
    </SettingsCard>
  );
}
