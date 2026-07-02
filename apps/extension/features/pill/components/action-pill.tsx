import { Check, Mic } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppLogo } from "~/features/pill/components/app-logo";
import { cn } from "~/lib/utils";
import { m } from "~/paraglide/messages";

const MAX_DURATION_MS = 5 * 60 * 1000;
const COUNTDOWN_START_MS = MAX_DURATION_MS - 10_000;

type Phase = "idle" | "recording" | "processing";

type Props = {
  phase: Phase;
  onRecord: () => void;
  onStop: () => void;
};

const SHORTCUT_FALLBACK = "Alt+Space";
const KEY_NAMES: Record<string, string> = {
  Alt: "Option",
  Option: "Option",
  Shift: "Shift",
  Ctrl: "Control",
  Control: "Control",
  Cmd: "Command",
  Command: "Command",
};

const KEY_DISPLAY: Record<string, string> = {
  Alt: "⌥",
  Option: "⌥",
  Shift: "⇧",
  Ctrl: "⌃",
  Control: "⌃",
  Cmd: "⌘",
  Command: "⌘",
  Space: "Space",
};

function useShortcutHint(): string {
  const [hint, setHint] = useState(SHORTCUT_FALLBACK);
  useEffect(() => {
    if (!chrome.commands?.getAll) return;
    chrome.commands
      .getAll()
      .then((commands) => {
        const toggle = commands.find((c) => c.name === "toggle-recording");
        if (toggle?.shortcut) setHint(toggle.shortcut);
      })
      .catch(() => {});
  }, []);
  return hint;
}

type ActionButtonProps = {
  phase: Phase;
  onRecord: () => void;
  onStop: () => void;
  compact?: boolean;
};

function actionButtonTitle(phase: Phase, shortcutHint: string): string {
  if (phase === "recording") return m.pill_record_stop();
  if (phase === "processing") return m.pill_transcribing();
  return m.pill_record_start({ shortcut: shortcutHint });
}

function actionButtonIcon(phase: Phase) {
  if (phase === "idle") return <Mic className="size-3" strokeWidth={2.3} aria-hidden />;
  if (phase === "recording") return <Check className="size-3" strokeWidth={2.5} aria-hidden />;
  return <ProcessingDots />;
}

function actionButtonClass(phase: Phase, compact: boolean): string {
  return cn(
    "relative inline-flex shrink-0 items-center justify-center rounded-full",
    "transition-[background-color,color,box-shadow] duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55",
    compact
      ? "size-6"
      : "size-6 bg-foreground text-background hover:bg-primary hover:text-primary-foreground",
    phase === "recording" &&
      "bg-foreground text-background shadow-[0_1px_0_color-mix(in_oklch,black_8%,transparent)] hover:bg-primary hover:text-primary-foreground",
    phase === "processing" && "cursor-not-allowed bg-transparent text-muted-foreground"
  );
}

function ActionButton({ phase, onRecord, onStop, compact = false }: ActionButtonProps) {
  const stopPointer = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (phase === "idle") onRecord();
      else if (phase === "recording") onStop();
    },
    [phase, onRecord, onStop]
  );

  const shortcutHint = useShortcutHint();
  const title = actionButtonTitle(phase, shortcutHint);

  return (
    <button
      type="button"
      onPointerDown={stopPointer}
      onClick={handleClick}
      disabled={phase === "processing"}
      title={phase === "idle" ? undefined : title}
      aria-label={title}
      className={actionButtonClass(phase, compact)}
    >
      {actionButtonIcon(phase)}
    </button>
  );
}

function shortcutKeys(shortcut: string): string[] {
  return shortcut.split("+").filter(Boolean);
}

function shortcutLabel(shortcut: string): string {
  return shortcutKeys(shortcut)
    .map((key) => KEY_NAMES[key] ?? key)
    .join(" + ");
}

function ShortcutHint({ shortcut }: { shortcut: string }) {
  const keys = shortcutKeys(shortcut);
  if (keys.length === 0) return null;
  return (
    <kbd
      className="inline-flex h-[18px] items-center gap-[3px] rounded-[6px] border border-white/5 bg-white/[0.06] px-[5px] text-[10px] font-medium leading-none text-muted-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,white_6%,transparent)]"
      aria-label={shortcutLabel(shortcut)}
      title={shortcutLabel(shortcut)}
    >
      {keys.map((key, index) => (
        <span key={`${key}-${index}`} className="inline-flex items-center gap-[3px]">
          {index > 0 ? (
            <span
              className="font-mono text-[8px] leading-none text-muted-foreground/55"
              aria-hidden
            >
              +
            </span>
          ) : null}
          <span
            className={cn(
              "inline-flex items-center justify-center font-mono tabular-nums",
              index === keys.length - 1
                ? "min-w-[13px] rounded-[4px] bg-foreground/10 px-1 py-[2px] text-[9px] text-foreground"
                : "min-w-[10px] text-[9px]"
            )}
          >
            {KEY_DISPLAY[key] ?? key}
          </span>
        </span>
      ))}
    </kbd>
  );
}

function ShortcutTooltip({ shortcut }: { shortcut: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border/70 bg-popover/98 px-3 py-1.5 text-xs font-medium leading-snug text-popover-foreground opacity-0 shadow-[0_12px_32px_-18px_color-mix(in_oklch,black_55%,transparent),inset_0_1px_0_color-mix(in_oklch,white_6%,transparent)] transition-[opacity,transform] duration-150 group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-within:-translate-y-0.5 group-focus-within:opacity-100"
    >
      {m.pill_shortcut_start_tooltip({ shortcut: shortcutLabel(shortcut) })}
      <span className="absolute left-1/2 top-full h-1 w-2 -translate-x-1/2 overflow-hidden">
        <span className="block h-2 w-2 -translate-y-1 rotate-45 border-r border-b border-border/70 bg-popover/98" />
      </span>
    </span>
  );
}

function RecordingBars() {
  return (
    <span
      className="flex h-3.5 min-w-0 flex-1 items-center justify-center gap-px overflow-hidden text-foreground/90"
      aria-hidden
    >
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
        <span
          key={index}
          className="w-0.5 rounded-full bg-current"
          style={{
            height: `${5 + ((index * 7) % 9)}px`,
            animation: "shadow-whisper-bars 850ms ease-in-out infinite",
            animationDelay: `${index * -65}ms`,
          }}
        />
      ))}
    </span>
  );
}

function useRecordingElapsed() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 250);
    return () => clearInterval(id);
  }, []);
  return elapsed;
}

function ProcessingDots() {
  return (
    <span
      className="flex items-center gap-1"
      style={{ animation: "shadow-whisper-processing 1.1s ease-in-out infinite" }}
      aria-hidden
    >
      <span className="size-1 rounded-full bg-muted-foreground" />
      <span className="size-1 rounded-full bg-muted-foreground" />
      <span className="size-1 rounded-full bg-muted-foreground" />
    </span>
  );
}

function RecordingPill({ onRecord, onStop }: { onRecord: () => void; onStop: () => void }) {
  const elapsed = useRecordingElapsed();
  const isCountdown = elapsed >= COUNTDOWN_START_MS;
  const countdownSeconds = Math.max(0, Math.ceil((MAX_DURATION_MS - elapsed) / 1000));

  return (
    <div className="flex h-8 w-[92px] items-center gap-1 rounded-full border border-border/65 bg-card/95 px-1 text-card-foreground shadow-[0_8px_22px_-16px_color-mix(in_oklch,black_42%,transparent),inset_0_1px_0_color-mix(in_oklch,white_8%,transparent)] backdrop-blur-md">
      <span
        className="ml-1 size-1.5 shrink-0 rounded-full bg-destructive shadow-[0_0_8px_color-mix(in_oklch,var(--color-destructive)_45%,transparent)]"
        aria-hidden
      />
      {isCountdown ? (
        <span
          className="flex min-w-0 flex-1 items-center justify-center font-mono text-[13px] font-semibold tabular-nums text-destructive"
          aria-hidden
        >
          {countdownSeconds}
        </span>
      ) : (
        <RecordingBars />
      )}
      <ActionButton phase="recording" onRecord={onRecord} onStop={onStop} compact />
    </div>
  );
}

export function ActionPill({ phase, onRecord, onStop }: Props) {
  const shortcutHint = useShortcutHint();

  if (phase === "processing") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={m.pill_transcribing()}
        className="flex h-8 w-14 items-center justify-center rounded-full border border-border/65 bg-card/95 text-card-foreground shadow-[0_8px_22px_-16px_color-mix(in_oklch,black_42%,transparent),inset_0_1px_0_color-mix(in_oklch,white_8%,transparent)] backdrop-blur-md"
      >
        <ProcessingDots />
      </div>
    );
  }

  if (phase === "recording") {
    return <RecordingPill onRecord={onRecord} onStop={onStop} />;
  }

  return (
    <div
      className="group relative inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border border-border/60 bg-card/95 px-2.5 text-card-foreground shadow-[0_8px_22px_-16px_color-mix(in_oklch,black_42%,transparent),inset_0_1px_0_color-mix(in_oklch,white_8%,transparent)] backdrop-blur-md"
      onClick={onRecord}
      aria-label={m.pill_shortcut_start_tooltip({ shortcut: shortcutLabel(shortcutHint) })}
    >
      <ShortcutTooltip shortcut={shortcutHint} />
      <AppLogo className="size-3 text-primary" />
      <ShortcutHint shortcut={shortcutHint} />
    </div>
  );
}
