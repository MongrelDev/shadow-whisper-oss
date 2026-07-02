import { m } from "~/paraglide/messages";

export function TranscriptionItemText({ text }: { text: string }): React.ReactElement {
  if (!text.trim()) {
    return (
      <p className="text-sm italic leading-relaxed text-muted-foreground">
        {m.home_transcription_empty_placeholder()}
      </p>
    );
  }

  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
      {text}
    </p>
  );
}
