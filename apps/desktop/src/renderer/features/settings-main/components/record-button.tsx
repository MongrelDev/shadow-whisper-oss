import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { m } from "~/paraglide/messages";

const recordButtonVariants = cva("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", {
  variants: {
    state: {
      idle: "bg-muted text-foreground hover:bg-accent",
      recording: "bg-destructive/10 text-destructive hover:bg-destructive/20",
      disabled: "bg-muted text-muted-foreground cursor-not-allowed",
    },
  },
  defaultVariants: {
    state: "idle",
  },
});

interface RecordButtonProps {
  recording: boolean;
  disabled?: boolean;
  onStart: () => void;
  onCancel: () => void;
}

export function RecordButton({
  recording,
  disabled,
  onStart,
  onCancel,
}: RecordButtonProps): React.ReactElement {
  const state = recording ? "recording" : disabled ? "disabled" : "idle";

  return (
    <button
      onClick={recording ? onCancel : onStart}
      disabled={disabled}
      className={cn(recordButtonVariants({ state }))}
    >
      {recording ? m.settings_record_button_cancel() : m.settings_record_button_start()}
    </button>
  );
}
