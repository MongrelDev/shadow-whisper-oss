import { useTranscriptionItem } from "./transcription-item-context";

export function TranscriptionItemTimestamp(): React.ReactElement {
  const { time } = useTranscriptionItem();

  return (
    <span className="mt-[3px] w-11 shrink-0 font-mono text-[11px] tabular-nums tracking-tight text-muted-foreground">
      {time}
    </span>
  );
}
