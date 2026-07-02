"use client";

import { useCallback, useState } from "react";
import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

import { cn } from "@/lib/utils";

import { countWords, formatElapsed } from "./shared";
import type { GuestPhase } from "./types";

interface TranscriptPanelProps {
  transcript: string;
  recording: boolean;
  phase: GuestPhase;
  elapsedMs: number;
  skillLabel: string;
  locale: Locale;
  onClear: () => void;
  compact?: boolean;
}

const ACTIVE_PHASES: ReadonlySet<GuestPhase> = new Set(["transcribing", "cleaning", "applying"]);

async function copyToClipboard(text: string): Promise<boolean> {
  if (!text || typeof navigator === "undefined" || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const PHASE_LABELS: Record<GuestPhase, (locale: Locale) => string> = {
  idle: (locale) => m.home_demo_transcript_label({}, { locale }),
  transcribing: (locale) => m.home_demo_phase_transcribing({}, { locale }),
  cleaning: (locale) => m.home_demo_phase_cleaning({}, { locale }),
  applying: (locale) => m.home_demo_phase_applying({}, { locale }),
  complete: (locale) => m.home_demo_phase_complete({}, { locale }),
  error: (locale) => m.home_demo_phase_error({}, { locale }),
  cancelled: (locale) => m.home_demo_phase_cancelled({}, { locale }),
};

function StatusLabel({
  recording,
  phase,
  locale,
}: {
  recording: boolean;
  phase: GuestPhase;
  locale: Locale;
}): React.ReactElement {
  if (recording) return <>{m.home_demo_recording({}, { locale })}…</>;
  return <>{PHASE_LABELS[phase](locale)}</>;
}

function CopyButton({ text, locale }: { text: string; locale: Locale }): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(async () => {
    const ok = await copyToClipboard(text);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }, [text]);
  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={!text}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15V5a2 2 0 0 1 2-2h10" />
      </svg>
      {copied ? m.home_demo_copied({}, { locale }) : m.home_demo_copy({}, { locale })}
    </button>
  );
}

function TranscriptDisplay({
  transcript,
  placeholder,
}: {
  transcript: string;
  placeholder: string;
}): React.ReactElement {
  if (!transcript) {
    return <p className="text-sm leading-7 text-muted-foreground">{placeholder}</p>;
  }
  const paragraphs = transcript
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="space-y-3 text-sm leading-7 text-foreground">
      {paragraphs.map((paragraph, idx) => (
        <p key={idx} className="whitespace-pre-wrap">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export function TranscriptPanel(props: TranscriptPanelProps): React.ReactElement {
  const { transcript, recording, phase, elapsedMs, skillLabel, locale, onClear, compact } = props;

  const wordCount = countWords(transcript);
  const wordCountLabel = m.home_demo_word_count({ count: wordCount }, { locale });
  const placeholder = m.home_demo_transcript_placeholder({}, { locale });
  const dimmed = ACTIVE_PHASES.has(phase);

  return (
    <div
      className={cn(
        "flex h-full flex-1 flex-col rounded-xl border border-border bg-background shadow-sm sm:min-h-[280px]",
        compact ? "min-h-[160px]" : "min-h-[200px]"
      )}
    >
      <div className="flex flex-col items-start gap-2 border-b border-border/60 px-4 py-2.5 text-xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <span className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.18em] text-muted-foreground">
          <span
            aria-hidden="true"
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              recording ? "animate-pulse bg-destructive" : "bg-muted-foreground/40"
            )}
          />
          <span className="text-foreground">
            <StatusLabel recording={recording} phase={phase} locale={locale} />
          </span>
        </span>
        <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">{formatElapsed(elapsedMs)}</span>
          <span aria-hidden="true">·</span>
          <span>{wordCountLabel}</span>
          <span aria-hidden="true">·</span>
          <span className="max-w-full truncate text-primary">{skillLabel}</span>
        </span>
      </div>
      <div
        role="region"
        aria-label={m.home_demo_transcript_label({}, { locale })}
        aria-live="polite"
        className={cn(
          "flex-1 px-4 py-4 sm:min-h-[280px]",
          compact ? "min-h-[104px]" : "min-h-[180px]",
          dimmed ? "opacity-70" : ""
        )}
      >
        <TranscriptDisplay transcript={transcript} placeholder={placeholder} />
      </div>
      <div className="flex flex-col items-start gap-3 border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <span>{wordCountLabel}</span>
        <span className="inline-flex flex-wrap items-center gap-2">
          <CopyButton text={transcript} locale={locale} />
          <button
            type="button"
            onClick={onClear}
            disabled={!transcript}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true">↺</span>
            {m.home_demo_clear({}, { locale })}
          </button>
        </span>
      </div>
    </div>
  );
}
