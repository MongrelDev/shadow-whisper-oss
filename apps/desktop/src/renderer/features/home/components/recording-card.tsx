import { Mic, Square } from "lucide-react";
import { cva } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { ShortcutKeys } from "@/components/ui/shortcut-keys";
import { cn } from "@/lib/utils";
import { m } from "~/paraglide/messages";

const cardVariants = cva(
  "relative @container flex flex-col justify-between rounded-xl border p-4 @sm:p-5 transition-colors",
  {
    variants: {
      recording: {
        true: "border-primary/40 bg-primary/[0.04]",
        false: "border-border/60 bg-card",
      },
    },
    defaultVariants: { recording: false },
  }
);

const dotVariants = cva("size-2 rounded-full", {
  variants: {
    recording: {
      true: "bg-primary animate-pulse shadow-[0_0_0_4px_color-mix(in_oklch,var(--color-primary)_18%,transparent)]",
      false: "bg-muted-foreground/40",
    },
  },
});

interface RecordingCardLayoutProps {
  isRecording: boolean;
  micLabel: string;
  recordAccelerator?: string;
  onToggle: () => void;
}

function Layout({
  isRecording,
  micLabel,
  recordAccelerator,
  onToggle,
}: RecordingCardLayoutProps): React.ReactElement {
  return (
    <article className={cn(cardVariants({ recording: isRecording }))}>
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={dotVariants({ recording: isRecording })} aria-hidden="true" />
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {m.home_recording_card_title()}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {m.home_recording_card_subtitle()}
        </p>
      </header>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Mic className="size-3.5 shrink-0" strokeWidth={1.75} />
        <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-muted-foreground/70">
          {m.home_recording_card_mic_label()}
        </span>
        <span className="truncate text-foreground">{micLabel}</span>
      </div>

      <footer className="mt-3 flex flex-col gap-3 @xs:flex-row @xs:items-center @xs:justify-between">
        <Button
          type="button"
          variant={isRecording ? "destructive" : "default"}
          size="sm"
          onClick={onToggle}
          className="h-9 px-4 text-sm font-semibold"
        >
          {isRecording ? (
            <>
              <Square className="size-3.5 fill-current" strokeWidth={1.75} />
              {m.home_recording_card_stop_button()}
            </>
          ) : (
            <>
              <Mic className="size-3.5" strokeWidth={1.75} />
              {m.home_recording_card_button()}
            </>
          )}
        </Button>

        {recordAccelerator && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground/70">
              {m.home_recording_card_shortcut_hint()}
            </span>
            <ShortcutKeys accelerator={recordAccelerator} size="sm" />
          </div>
        )}
      </footer>
    </article>
  );
}

export const RecordingCard = {
  Layout,
};
