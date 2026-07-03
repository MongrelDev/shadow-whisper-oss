import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { m } from "~/paraglide/messages";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { cn } from "@/lib/utils";

const MAX_DURATION_MS = 5 * 60 * 1000;
const COUNTDOWN_START_MS = MAX_DURATION_MS - 10_000;

// Active pills (recording + processing) render as solid, firmly bordered
// surfaces: while capturing, the pill is the focus and should read as opaque
// chrome, not glass. The idle/minimized pill keeps its translucency. Action
// Mode carries a thicker amber frame with a soft amber halo so it is
// unmistakable against the neutral recording pill.
const activePillBase =
  "origin-bottom flex h-8 items-center rounded-full border-2 bg-card text-card-foreground shadow-[0_10px_26px_-16px_oklch(0_0_0/0.5),inset_0_1px_0_oklch(1_0_0/0.08)]";

const activePillVariants = {
  default: "border-border",
  action: "border-amber-400 ring-2 ring-amber-400/30",
} as const;

const recordingPillVariants = cva(`${activePillBase} w-[116px] gap-1 px-1`, {
  variants: { variant: activePillVariants },
  defaultVariants: { variant: "default" },
});

const processingPillVariants = cva(`${activePillBase} w-14 justify-center`, {
  variants: { variant: activePillVariants },
  defaultVariants: { variant: "default" },
});

export type PillVariant = VariantProps<typeof recordingPillVariants>["variant"];

interface ActiveRecordingPillProps {
  display?: boolean;
  isSpeaking: boolean;
  volumeLevel: number;
  waveformHistory: number[];
  variant?: PillVariant;
  onCancel: () => void;
  onStop: () => void;
}

interface PillIconButtonProps {
  readonly label: string;
  readonly tone: "cancel" | "confirm";
  readonly accent?: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}

// The confirm button carries the mode: neutral (foreground) while dictating,
// amber in Action Mode so the primary affordance matches the amber frame.
const confirmTone = {
  default:
    "bg-foreground text-background shadow-[0_1px_0_oklch(0_0_0/0.08)] hover:bg-primary hover:text-primary-foreground focus-visible:ring-primary/55",
  action:
    "bg-amber-400 text-amber-950 shadow-[0_1px_0_oklch(0_0_0/0.12)] hover:bg-amber-300 focus-visible:ring-amber-400/60",
} as const;

function PillIconButton({
  label,
  tone,
  accent = false,
  onClick,
  children,
}: PillIconButtonProps): React.ReactElement {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      className={cn(
        "relative inline-flex size-6 shrink-0 items-center justify-center rounded-full",
        "transition-[background-color,color,box-shadow] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "before:absolute before:-inset-1 before:content-['']",
        tone === "cancel"
          ? "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-primary/55"
          : confirmTone[accent ? "action" : "default"]
      )}
    >
      {children}
    </motion.button>
  );
}

export function ActiveRecordingPill({
  display = true,
  isSpeaking,
  volumeLevel,
  waveformHistory,
  variant,
  onCancel,
  onStop,
}: ActiveRecordingPillProps): React.ReactElement | null {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 250);
    return () => clearInterval(id);
  }, []);

  if (!display) return null;

  const isCountdown = elapsed >= COUNTDOWN_START_MS;
  const countdownSeconds = Math.max(0, Math.ceil((MAX_DURATION_MS - elapsed) / 1000));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 5 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={recordingPillVariants({ variant })}
    >
      <PillIconButton label={m.pill_recording_cancel_aria_label()} tone="cancel" onClick={onCancel}>
        <X className="size-3" strokeWidth={2.3} aria-hidden />
      </PillIconButton>

      <div className="min-w-0 flex-1 flex items-center justify-center" aria-hidden>
        {isCountdown ? (
          <span className="font-mono text-[13px] font-semibold tabular-nums text-destructive">
            {countdownSeconds}
          </span>
        ) : (
          <LiveWaveform
            active
            processing={false}
            values={waveformHistory}
            mode="scrolling"
            height={14}
            historySize={36}
            barWidth={2}
            barGap={1}
            barRadius={999}
            barHeight={2}
            fadeEdges
            fadeWidth={10}
            sensitivity={Math.max(isSpeaking ? 0.9 : 0.72, volumeLevel * 1.25)}
            className={variant === "action" ? "text-amber-400" : "text-foreground/90"}
          />
        )}
      </div>

      <PillIconButton
        label={m.pill_recording_finish_aria_label()}
        tone="confirm"
        accent={variant === "action"}
        onClick={onStop}
      >
        <Check className="size-3" strokeWidth={2.5} aria-hidden />
      </PillIconButton>
    </motion.div>
  );
}

export function ProcessingPill({
  display = true,
  variant,
  label,
}: {
  display?: boolean;
  variant?: PillVariant;
  label?: string;
}): React.ReactElement | null {
  if (!display) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 5 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={processingPillVariants({ variant })}
      role="status"
      aria-live="polite"
      aria-label={label ?? m.pill_transcribing_label()}
    >
      <motion.span
        className="flex items-center gap-1"
        initial={false}
        animate={{ opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      >
        <span className="size-1 rounded-full bg-muted-foreground" />
        <span className="size-1 rounded-full bg-muted-foreground" />
        <span className="size-1 rounded-full bg-muted-foreground" />
      </motion.span>
    </motion.div>
  );
}
