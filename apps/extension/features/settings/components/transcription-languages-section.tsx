import { AVAILABLE_LANGUAGES } from "~/lib/languages";
import { useExtensionPreferences } from "~/features/settings/hooks/use-extension-preferences";
import { cn } from "~/lib/utils";
import { m } from "~/paraglide/messages";

function LanguageChip({
  code,
  label,
  flag,
  selected,
  onToggle,
}: {
  code: string;
  label: string;
  flag: string;
  selected: boolean;
  onToggle: (code: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(code)}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
        selected
          ? "border-primary/50 bg-primary/10 text-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      )}
    >
      <span>{flag}</span>
      <span>{label}</span>
    </button>
  );
}

function ChipGridSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

export function TranscriptionLanguagesSection() {
  const { selectedLanguages, setSelectedLanguages, loading } = useExtensionPreferences();

  function handleToggle(code: string) {
    if (selectedLanguages.includes(code)) {
      if (selectedLanguages.length === 1) return;
      setSelectedLanguages(selectedLanguages.filter((c) => c !== code));
    } else {
      setSelectedLanguages([...selectedLanguages, code]);
    }
  }

  return (
    <section id="transcription" className="rounded-xl border border-border bg-background p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {m.settings_transcription_section()}
      </h2>
      <div className="space-y-3">
        <div>
          <p className="text-sm text-foreground">{m.settings_languages_label()}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {selectedLanguages.length === 1
              ? m.settings_languages_single()
              : m.settings_languages_multiple({ count: selectedLanguages.length })}
          </p>
        </div>
        {loading ? (
          <ChipGridSkeleton />
        ) : (
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_LANGUAGES.map(({ code, label, flag }) => (
              <LanguageChip
                key={code}
                code={code}
                label={label}
                flag={flag}
                selected={selectedLanguages.includes(code)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
        {selectedLanguages.length === 1 && (
          <p className="text-xs text-muted-foreground">{m.settings_languages_min_warning()}</p>
        )}
      </div>
    </section>
  );
}
