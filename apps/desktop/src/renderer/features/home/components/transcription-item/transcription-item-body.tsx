import { m } from "~/paraglide/messages";
import { TranscriptionItemPlayer } from "./transcription-item-player";
import { TranscriptionItemText } from "./transcription-item-text";
import { useTranscriptionItem } from "./transcription-item-context";

export function TranscriptionItemBody(): React.ReactElement {
  const { view, audioUrl, entryId, visibleText, totalDurationSeconds, isCancelled } =
    useTranscriptionItem();
  const isPlayerView = view === "player" && audioUrl;
  const showCancelledPlaceholder = isCancelled && !visibleText.trim() && !isPlayerView;

  return (
    <div className="max-h-40 overflow-y-auto">
      {isPlayerView ? (
        <TranscriptionItemPlayer
          entryId={entryId}
          src={audioUrl}
          fallbackDuration={totalDurationSeconds}
        />
      ) : showCancelledPlaceholder ? (
        <p className="text-sm italic text-muted-foreground/60">
          {m.home_transcription_placeholder_cancelled()}
        </p>
      ) : (
        <TranscriptionItemText text={visibleText} />
      )}
    </div>
  );
}
