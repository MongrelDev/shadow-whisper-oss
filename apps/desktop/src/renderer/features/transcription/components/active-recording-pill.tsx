import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { m } from "~/paraglide/messages";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { cn } from "@/lib/utils";

const MAX_DURATION_MS = 5 * 60 * 1000;
const COUNTDOWN_START_MS = MAX_DURATION_MS - 10_000;

const recordingPillVariants = cva(
  "origin-bottom flex h-8 w-[116px] items-center gap-1 rounded-full border bg-card/95 px-1 text-card-foreground shadow-[0_8px_22px_-16px_oklch(0_0_0/0.42),inset_0_1px_0_oklch(1_0_0/0.08)] supports-[backdrop-filter]:bg-card/85 supports-[backdrop-filter]:backdrop-blur-md",
  {
    variants: {
      variant: {
        default: "border-border/65",
        action: "border-amber-400/90 ring-1 ring-amber-400/45",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const processingPillVariants = cva(
  "origin-bottom flex h-8 w-14 items-center justify-center rounded-full border bg-card/95 text-card-foreground shadow-[0_8px_22px_-16px_oklch(0_0_0/0.42),inset_0_1px_0_oklch(1_0_0/0.08)] supports-[backdrop-filter]:bg-card/85 supports-[backdrop-filter]:backdrop-blur-md",
  {
    variants: {
      variant: {
        default: "border-border/65",
        action: "border-amber-400/90 ring-1 ring-amber-400/45",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

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
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}

function PillIconButton({
  label,
  tone,
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
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "before:absolute before:-inset-1 before:content-['']",
        tone === "cancel"
          ? "text-muted-foreground hover:bg-muted hover:text-foreground"
          : "bg-foreground text-background shadow-[0_1px_0_oklch(0_0_0/0.08)] hover:bg-primary hover:text-primary-foreground"
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
            className="text-foreground/90"
          />
        )}
      </div>

      <PillIconButton label={m.pill_recording_finish_aria_label()} tone="confirm" onClick={onStop}>
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
