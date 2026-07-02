import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/hooks/use-theme";
import { DEFAULT_PREFERENCES } from "@/hooks/use-config";
import { m } from "~/paraglide/messages";
import { SettingsCard, Row, RestoreButton } from "./settings-primitives";

function ThemeSegment({
  theme,
  setTheme,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
}): React.ReactElement {
  const options: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: m.settings_appearance_theme_option_light() },
    { value: "dark", icon: Moon, label: m.settings_appearance_theme_option_dark() },
    { value: "system", icon: Monitor, label: m.settings_appearance_theme_option_system() },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-muted">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function AppearanceSection(): React.ReactElement {
  const { theme, setTheme } = useTheme();

  return (
    <SettingsCard>
      <Row
        label={m.settings_appearance_theme_label()}
        sublabel={m.settings_appearance_theme_sublabel()}
      >
        <ThemeSegment theme={theme} setTheme={setTheme} />
      </Row>
      <Row
        label={m.settings_appearance_theme_default_label()}
        sublabel={m.settings_appearance_theme_default_sublabel()}
      >
        <RestoreButton
          onClick={() => setTheme(DEFAULT_PREFERENCES.theme)}
          disabled={theme === DEFAULT_PREFERENCES.theme}
        />
      </Row>
    </SettingsCard>
  );
}
