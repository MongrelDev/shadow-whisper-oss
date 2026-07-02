import { Check, Clipboard, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteExtensionHistoryEntry, type ExtensionHistoryEntry } from "../lib/history-storage";
import { m } from "~/paraglide/messages";

function formatTime(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${remainder}s`;
}

function TextLabel({ label }: { label: string }): React.ReactElement {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
      {label}
    </p>
  );
}

function HistoryItemBody({ entry }: { entry: ExtensionHistoryEntry }): React.ReactElement {
  const duration = formatDuration(entry.durationSeconds);
  const identical = entry.rawText.trim() === entry.formattedText.trim();

  return (
    <div className="min-w-0 flex-1 space-y-2">
      <div className="space-y-1">
        <TextLabel label={m.history_item_improved_label()} />
        <p className="line-clamp-4 text-sm leading-6 text-foreground">{entry.formattedText}</p>
      </div>
      {!identical && (
        <div className="space-y-1">
          <TextLabel label={m.history_item_raw_label()} />
          <p className="line-clamp-4 text-sm leading-6 text-muted-foreground/80">{entry.rawText}</p>
        </div>
      )}
      {duration && (
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          {duration}
        </p>
      )}
    </div>
  );
}

export function HistoryItem({ entry }: { entry: ExtensionHistoryEntry }): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(entry.formattedText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <li className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
      <span className="mt-[3px] w-11 shrink-0 font-mono text-[11px] tabular-nums tracking-tight text-muted-foreground">
        {formatTime(entry.createdAt)}
      </span>
      <HistoryItemBody entry={entry} />
      <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <button
          type="button"
          onClick={() => void copy()}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={m.history_copy_action()}
          title={m.history_copy_action()}
        >
          {copied ? <Check className="size-4" /> : <Clipboard className="size-4" />}
        </button>
        <button
          type="button"
          onClick={() => void deleteExtensionHistoryEntry(entry.id)}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={m.history_delete_action()}
          title={m.history_delete_action()}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}
