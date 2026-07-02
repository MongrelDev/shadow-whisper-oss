import {
  AudioPlayerButton,
  AudioPlayerDuration,
  AudioPlayerProgress,
  AudioPlayerTime,
} from "@/components/ui/audio-player";

export function TranscriptionItemPlayer({
  entryId,
  src,
  fallbackDuration,
}: {
  entryId: number;
  src: string;
  fallbackDuration?: number;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-3 py-2">
      <AudioPlayerButton
        item={{ id: entryId, src }}
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full"
      />
      <AudioPlayerTime />
      <AudioPlayerProgress className="flex-1" fallbackDuration={fallbackDuration} />
      <AudioPlayerDuration fallbackDuration={fallbackDuration} />
    </div>
  );
}
