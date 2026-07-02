import { useState } from "react";
import { acceleratorToDisplay, checkConflict } from "@/lib/accelerator";
import { useShortcutRecorder } from "@/hooks/use-shortcut-recorder";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { DEFAULT_SHORTCUTS } from "@/hooks/use-config";
import { SHORTCUT_PRESETS } from "@/features/onboarding/types";
import { cn } from "@/lib/utils";
import { m } from "~/paraglide/messages";
import { ShortcutsSection, ShortcutSlot, type ShortcutKey } from "../components/shortcuts-section";

interface SlotContainerProps {
  label: string;
  shortcutKey: ShortcutKey;
  currentAccelerator: string;
  defaultAccelerator: string;
  showPresets?: boolean;
  onUpdate: (key: ShortcutKey, accelerator: string) => Promise<void>;
}

function ShortcutPresetRow({
  currentAccelerator,
  onSelect,
}: {
  currentAccelerator: string;
  onSelect: (accelerator: string) => void;
}): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2 ml-auto justify-end">
      {SHORTCUT_PRESETS.map((preset) => {
        const selected = preset.accelerator === currentAccelerator;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.accelerator)}
            className={cn(
              "px-2 py-0.5 rounded-md font-mono text-[11px] border transition-colors",
              selected
                ? "text-primary border-primary/40 bg-primary/5"
                : "text-muted-foreground border-border hover:text-foreground"
            )}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}

function ShortcutSlotContainer({
  label,
  shortcutKey,
  currentAccelerator,
  defaultAccelerator,
  showPresets = false,
  onUpdate,
}: SlotContainerProps): React.ReactElement {
  const [error, setError] = useState<string | null>(null);

  const { recording, currentKeys, startRecording, cancelRecording } = useShortcutRecorder({
    onComplete: async (accelerator) => {
      setError(null);
      try {
        await onUpdate(shortcutKey, accelerator);
      } catch (err) {
        setError(err instanceof Error ? err.message : m.settings_shortcuts_slot_update_error());
      }
    },
  });

  const handleRestore = async () => {
    setError(null);
    try {
      await onUpdate(shortcutKey, defaultAccelerator);
    } catch (err) {
      setError(err instanceof Error ? err.message : m.settings_shortcuts_slot_restore_error());
    }
  };

  return (
    <div>
      <ShortcutSlot
        label={label}
        displayKeys={recording ? currentKeys : acceleratorToDisplay(currentAccelerator)}
        recording={recording}
        isDefault={currentAccelerator === defaultAccelerator}
        conflict={!recording ? checkConflict(currentAccelerator) : null}
        error={error}
        onStartRecording={startRecording}
        onCancelRecording={cancelRecording}
        onRestore={handleRestore}
      />
      {showPresets && (
        <ShortcutPresetRow
          currentAccelerator={currentAccelerator}
          onSelect={(accelerator) => {
            setError(null);
            void onUpdate(shortcutKey, accelerator).catch((err) =>
              setError(
                err instanceof Error ? err.message : m.settings_shortcuts_slot_update_error()
              )
            );
          }}
        />
      )}
    </div>
  );
}

export function ShortcutsContainer(): React.ReactElement | null {
  const { shortcuts, updateShortcutAsync } = useShortcuts();

  if (!shortcuts) return null;

  const handleUpdate = async (key: ShortcutKey, accelerator: string) => {
    await updateShortcutAsync({ key, accelerator });
  };

  return (
    <ShortcutsSection>
      <ShortcutSlotContainer
        label={m.settings_shortcuts_label_transcription()}
        shortcutKey="transcription"
        currentAccelerator={shortcuts.transcription}
        defaultAccelerator={DEFAULT_SHORTCUTS.transcription}
        showPresets
        onUpdate={handleUpdate}
      />
      <ShortcutSlotContainer
        label={m.settings_shortcuts_label_cancel_recording()}
        shortcutKey="cancelRecording"
        currentAccelerator={shortcuts.cancelRecording}
        defaultAccelerator={DEFAULT_SHORTCUTS.cancelRecording}
        onUpdate={handleUpdate}
      />
      <ShortcutSlotContainer
        label={m.settings_shortcuts_label_paste_last()}
        shortcutKey="pasteLastTranscript"
        currentAccelerator={shortcuts.pasteLastTranscript}
        defaultAccelerator={DEFAULT_SHORTCUTS.pasteLastTranscript}
        onUpdate={handleUpdate}
      />
      <ShortcutSlotContainer
        label={m.settings_shortcuts_label_view_last_diff()}
        shortcutKey="viewLastDiff"
        currentAccelerator={shortcuts.viewLastDiff}
        defaultAccelerator={DEFAULT_SHORTCUTS.viewLastDiff}
        onUpdate={handleUpdate}
      />
    </ShortcutsSection>
  );
}
