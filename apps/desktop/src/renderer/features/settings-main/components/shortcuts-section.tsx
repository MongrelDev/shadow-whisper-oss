import { SettingsCard, ShortcutBadges, RestoreButton } from "./settings-primitives";
import { RecordButton } from "./record-button";
import { m } from "~/paraglide/messages";

export type ShortcutKey =
  | "transcription"
  | "pasteLastTranscript"
  | "cancelRecording"
  | "viewLastDiff";

interface ShortcutSlotProps {
  label: string;
  displayKeys: string[];
  recording: boolean;
  disabled?: boolean;
  isDefault: boolean;
  conflict: string | null;
  error: string | null;
  badge?: string;
  onStartRecording: () => void;
  onCancelRecording: () => void;
  onRestore: () => void;
}

export function ShortcutSlot({
  label,
  displayKeys,
  recording,
  disabled,
  isDefault,
  conflict,
  error,
  badge,
  onStartRecording,
  onCancelRecording,
  onRestore,
}: ShortcutSlotProps): React.ReactElement {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-base text-foreground">{label}</p>
          {badge && (
            <span className="bg-amber-500/10 text-amber-500 text-xs font-medium rounded-full px-2 py-0.5">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-6">
          <ShortcutBadges keys={displayKeys} />
          <RecordButton
            recording={recording}
            disabled={disabled}
            onStart={onStartRecording}
            onCancel={onCancelRecording}
          />
          <RestoreButton onClick={onRestore} disabled={disabled || isDefault || recording} />
        </div>
      </div>
      {conflict && (
        <p className="text-sm text-amber-500 mt-1.5">
          {m.settings_shortcuts_conflict_prefix()} {conflict}
        </p>
      )}
      {error && <p className="text-sm text-destructive mt-1.5">{error}</p>}
    </div>
  );
}

interface ShortcutsSectionProps {
  children: React.ReactNode;
}

export function ShortcutsSection({ children }: ShortcutsSectionProps): React.ReactElement {
  return <SettingsCard>{children}</SettingsCard>;
}
