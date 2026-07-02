import * as React from "react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ShortcutKeys } from "@/components/ui/shortcut-keys";
import { acceleratorToDisplay } from "@/lib/accelerator";
import { useShortcutRecorder } from "@/hooks/use-shortcut-recorder";
import { m } from "~/paraglide/messages";

interface SkillShortcutControlContainerProps {
  skillId: string;
  accelerator: string | null;
  disabled?: boolean;
}

export function SkillShortcutControlContainer({
  skillId,
  accelerator,
  disabled = false,
}: SkillShortcutControlContainerProps): React.ReactElement {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  async function commit(next: string | null): Promise<void> {
    const result = await window.api.skills.setShortcut(skillId, next);
    if (!result.success) {
      setError(result.error ?? m.settings_shortcuts_slot_update_error());
      return;
    }
    setError(null);
    await queryClient.invalidateQueries({ queryKey: ["config"] });
  }

  const { recording, currentKeys, startRecording, cancelRecording } = useShortcutRecorder({
    onComplete: (next) => void commit(next),
  });

  const handleMainClick = (): void => {
    setError(null);
    if (recording) cancelRecording();
    else startRecording();
  };

  const handleClear = (): void => void commit(null);

  const showClear = accelerator !== null && !recording && !disabled;

  return (
    <div className="flex items-center gap-1">
      {showClear ? <ClearButton onClick={handleClear} /> : null}
      <MainButton
        accelerator={accelerator}
        recording={recording}
        currentKeys={currentKeys}
        disabled={disabled}
        error={error}
        onClick={handleMainClick}
      />
    </div>
  );
}

function ClearButton({ onClick }: { onClick: () => void }): React.ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClick}
          aria-label={m.skills_shortcut_clear()}
          className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{m.skills_shortcut_clear()}</TooltipContent>
    </Tooltip>
  );
}

function MainButton({
  accelerator,
  recording,
  currentKeys,
  disabled,
  error,
  onClick,
}: {
  accelerator: string | null;
  recording: boolean;
  currentKeys: string[];
  disabled: boolean;
  error: string | null;
  onClick: () => void;
}): React.ReactElement {
  const tooltip = getTooltip({ accelerator, recording, error });
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onClick}
          aria-label={tooltip}
          className={cn(
            "w-32",
            !accelerator &&
              !recording &&
              "border-dashed text-muted-foreground hover:text-foreground",
            recording && "border-primary ring-2 ring-primary/40",
            error && "border-destructive ring-2 ring-destructive/30"
          )}
        >
          <MainButtonContent
            accelerator={accelerator}
            recording={recording}
            currentKeys={currentKeys}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function MainButtonContent({
  accelerator,
  recording,
  currentKeys,
}: {
  accelerator: string | null;
  recording: boolean;
  currentKeys: string[];
}): React.ReactElement {
  if (recording && currentKeys.length > 0) return <ShortcutKeys keys={currentKeys} size="sm" />;
  if (recording) {
    return (
      <span className="text-xs font-medium text-primary">
        {m.skills_shortcut_recording_prompt()}
      </span>
    );
  }
  if (accelerator) return <ShortcutKeys keys={acceleratorToDisplay(accelerator)} size="sm" />;
  return (
    <>
      <Plus className="size-3" strokeWidth={2} aria-hidden />
      <span className="text-xs font-medium">{m.skills_shortcut_set()}</span>
    </>
  );
}

function getTooltip({
  accelerator,
  recording,
  error,
}: {
  accelerator: string | null;
  recording: boolean;
  error: string | null;
}): string {
  if (error) return error;
  if (recording) return m.skills_shortcut_recording_prompt();
  if (accelerator) return m.skills_shortcut_redefine_tooltip();
  return m.skills_shortcut_hint();
}
