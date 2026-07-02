import { m } from "~/paraglide/messages";
import { cn } from "@/lib/utils";
import { useTranscriptionItem } from "./transcription-item-context";

type MetaPart = {
  key: string;
  label: string;
  tone?: "default" | "warn" | "accent";
};

function buildParts(ctx: {
  wordCount: number;
  language: string;
  duration: string;
  isCancelled: boolean;
  view: string;
}): MetaPart[] {
  const parts: MetaPart[] = [];
  if (ctx.wordCount > 0) parts.push({ key: "words", label: `${ctx.wordCount} ${m.stats_words()}` });
  if (ctx.language) parts.push({ key: "language", label: ctx.language });
  if (ctx.duration) parts.push({ key: "duration", label: ctx.duration });
  if (ctx.isCancelled)
    parts.push({ key: "cancelled", label: m.home_transcription_label_cancelled(), tone: "warn" });
  if (ctx.view === "raw")
    parts.push({ key: "raw", label: m.home_transcription_label_raw(), tone: "accent" });
  return parts;
}

export function TranscriptionItemHeader(): React.ReactElement | null {
  const ctx = useTranscriptionItem();
  const parts = buildParts(ctx);

  if (parts.length === 0) return null;

  return (
    <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
      {parts.map((part, index) => (
        <span key={part.key}>
          {index > 0 && <span className="mx-1.5 text-muted-foreground/40">·</span>}
          <span
            className={cn(
              part.tone === "warn" && "text-amber-500/80",
              part.tone === "accent" && "text-primary/80"
            )}
          >
            {part.label}
          </span>
        </span>
      ))}
    </p>
  );
}
