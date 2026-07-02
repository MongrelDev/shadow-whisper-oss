import { Check, Copy, Play, Redo2, Square, Trash2, Undo2 } from "lucide-react";
import { m } from "~/paraglide/messages";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranscriptionItem } from "./transcription-item-context";

const actionBtn = cn(
  "size-7 rounded-md",
  "opacity-0 transition-opacity duration-100",
  "group-hover:opacity-100 group-focus-within:opacity-100",
  "focus-visible:opacity-100"
);

function CopyButton(): React.ReactElement | null {
  const { isCancelled, copied, visibleText, onCopy } = useTranscriptionItem();
  if (isCancelled) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={m.home_transcription_action_copy()}
      onClick={onCopy}
      disabled={!visibleText.trim()}
      className={actionBtn}
    >
      {copied ? <Check className="size-3.5 text-violet" /> : <Copy className="size-3.5" />}
    </Button>
  );
}

function ToggleRawButton(): React.ReactElement | null {
  const { canToggleText, isCancelled, view, onToggleRaw } = useTranscriptionItem();
  if (!canToggleText || isCancelled || view === "player") return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={
        view === "raw"
          ? m.home_transcription_action_view_formatted()
          : m.home_transcription_action_view_raw()
      }
      onClick={onToggleRaw}
      className={actionBtn}
    >
      {view === "raw" ? <Redo2 className="size-3.5" /> : <Undo2 className="size-3.5" />}
    </Button>
  );
}

function AudioToggleButton(): React.ReactElement | null {
  const { audioUrl, view, onTogglePlayer } = useTranscriptionItem();
  if (!audioUrl) return null;

  const isActive = view === "player";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={
        isActive
          ? m.home_transcription_action_return_to_text()
          : m.home_transcription_action_listen_audio()
      }
      onClick={onTogglePlayer}
      className={cn(actionBtn, isActive && "opacity-100 text-violet")}
    >
      {isActive ? <Square className="size-3" /> : <Play className="size-3.5" />}
    </Button>
  );
}

function DeleteButton(): React.ReactElement {
  const { deletePending, deleteDisabled, onDelete } = useTranscriptionItem();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={m.home_transcription_action_delete()}
      onClick={onDelete}
      disabled={deleteDisabled}
      className={cn(actionBtn, "hover:text-destructive")}
    >
      <Trash2 className={cn("size-3.5", deletePending && "animate-pulse")} />
    </Button>
  );
}

export function TranscriptionItemActions(): React.ReactElement {
  return (
    <div className="-mt-0.5 flex shrink-0 flex-col items-center lg:flex-row">
      <CopyButton />
      <ToggleRawButton />
      <AudioToggleButton />
      <DeleteButton />
    </div>
  );
}
