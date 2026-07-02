"use client";

import { CircleHelp } from "lucide-react";
import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { cn } from "@/lib/utils";

import { ShortcutChips, formatElapsed, type DetectedOs } from "./shared";

interface RecordPillButtonProps {
  recording: boolean;
  busy: boolean;
  elapsedMs: number;
  os: DetectedOs;
  locale: Locale;
  onToggle: () => void;
  onCancel: () => void;
}

function RecordHint({
  recording,
  locale,
}: {
  recording: boolean;
  locale: Locale;
}): React.ReactElement {
  const text = recording
    ? m.home_demo_record_hint_recording({}, { locale })
    : m.home_demo_record_hint_idle({}, { locale });

  return <p className="text-sm leading-6 text-muted-foreground">{text}</p>;
}

function RecordHintPopover({
  recording,
  locale,
}: {
  recording: boolean;
  locale: Locale;
}): React.ReactElement {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label={m.home_demo_record_hint_label({}, { locale })}
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl p-3.5"
      >
        <div className="space-y-1.5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground">
            {m.home_demo_record_hint_label({}, { locale })}
          </p>
          <RecordHint recording={recording} locale={locale} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CancelButton({
  onCancel,
  locale,
}: {
  onCancel: () => void;
  locale: Locale;
}): React.ReactElement {
  const label = m.home_demo_cancel({}, { locale });
  return (
    <button
      type="button"
      onClick={onCancel}
      className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium text-card-foreground transition-colors hover:bg-accent"
      aria-label={label}
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
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function RecordingDot(): React.ReactElement {
  return (
    <span className="relative flex size-3 items-center justify-center" aria-hidden="true">
      <span className="absolute inset-0 animate-ping rounded-full bg-[#e14949]/40" />
      <span className="relative size-2 rounded-full bg-[#e14949] shadow-[0_0_8px_rgba(225,73,73,0.55)]" />
    </span>
  );
}

function IdlePill({
  os,
  label,
  busy,
  onToggle,
}: {
  os: DetectedOs;
  label: string;
  busy: boolean;
  onToggle: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      className={cn(
        "inline-flex h-10 min-w-0 flex-1 items-center justify-start gap-2.5 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 sm:flex-initial",
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
    >
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-background/70" />
      <span className="truncate">{label}</span>
      <span className="hidden lg:inline-flex">
        <ShortcutChips os={os} size="sm" />
      </span>
    </button>
  );
}

function RecordingPill({
  elapsedMs,
  os,
  label,
  onToggle,
}: {
  elapsedMs: number;
  os: DetectedOs;
  label: string;
  onToggle: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed
      aria-label={label}
      className={cn(
        "flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-[#e14949]/30 bg-card px-3 text-card-foreground",
        "shadow-[0_14px_40px_-10px_rgba(225,73,73,0.25),inset_0_0_0_1px_rgba(225,73,73,0.12)]",
        "transition-colors hover:bg-accent"
      )}
    >
      <RecordingDot />
      <div className="min-w-0 flex-1">
        <LiveWaveform
          active
          mode="scrolling"
          height={18}
          historySize={120}
          barWidth={2}
          barGap={2}
          barRadius={999}
          barHeight={3}
          fadeEdges
          fadeWidth={24}
          className="text-foreground"
        />
      </div>
      <span
        className="shrink-0 font-mono text-[11px] font-medium tabular-nums tracking-tight text-foreground"
        aria-hidden="true"
      >
        {formatElapsed(elapsedMs)}
      </span>
      <span aria-hidden="true" className="hidden h-4 w-px shrink-0 bg-border/60 lg:block" />
      <span className="hidden shrink-0 lg:inline-flex">
        <ShortcutChips os={os} size="sm" />
      </span>
    </button>
  );
}

export function RecordPillButton({
  recording,
  busy,
  elapsedMs,
  os,
  locale,
  onToggle,
  onCancel,
}: RecordPillButtonProps): React.ReactElement {
  const idleLabel = m.home_demo_record({}, { locale });
  const recordingLabel = m.home_demo_recording({}, { locale });
  return (
    <div className="flex min-w-0 items-center gap-2">
      {recording ? (
        <RecordingPill elapsedMs={elapsedMs} os={os} label={recordingLabel} onToggle={onToggle} />
      ) : (
        <IdlePill os={os} label={idleLabel} busy={busy} onToggle={onToggle} />
      )}
      <RecordHintPopover recording={recording} locale={locale} />
      {recording ? <CancelButton onCancel={onCancel} locale={locale} /> : null}
    </div>
  );
}
