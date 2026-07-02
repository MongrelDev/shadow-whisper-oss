import { motion, AnimatePresence } from "motion/react";
import { Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShortcutRecorder } from "@/hooks/use-shortcut-recorder";
import { ShortcutKeys } from "@/components/ui/shortcut-keys";
import { m } from "~/paraglide/messages";
import { SHORTCUT_PRESETS } from "../types";

interface StepShortcutProps {
  accelerator: string;
  onChange: (accelerator: string) => void;
}

export function StepShortcut({ accelerator, onChange }: StepShortcutProps): React.ReactElement {
  const { recording, currentKeys, startRecording, cancelRecording } = useShortcutRecorder({
    onComplete: onChange,
  });

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
        {m.onboarding_shortcut_eyebrow()}
      </p>
      <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground">
        {m.onboarding_shortcut_title()}
      </h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
        {m.onboarding_shortcut_subtitle()}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        className={cn(
          "mt-6 flex flex-col items-center gap-4 px-6 py-8 rounded-xl border transition-colors",
          recording ? "border-primary/50 bg-accent/40" : "border-border bg-card"
        )}
      >
        <AnimatePresence mode="wait">
          {recording ? (
            <motion.div
              key="recording"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Keyboard className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="font-mono text-base tracking-wider text-foreground">
                {currentKeys.length > 0
                  ? currentKeys.join(" ")
                  : m.onboarding_shortcut_recording_placeholder()}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ShortcutKeys accelerator={accelerator} size="lg" />
            </motion.div>
          )}
        </AnimatePresence>

        <span className="font-mono text-[11px] tracking-[0.04em] text-muted-foreground">
          {m.onboarding_shortcut_caption()}
        </span>

        {recording ? (
          <button
            type="button"
            onClick={cancelRecording}
            className="mt-1 px-3.5 py-2 rounded-lg border border-border text-[12.5px] text-muted-foreground hover:bg-accent transition-colors"
          >
            {m.onboarding_shortcut_action_cancel()}
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="mt-1 px-3.5 py-2 rounded-lg border border-border text-[12.5px] text-foreground hover:bg-accent transition-colors"
          >
            {m.onboarding_shortcut_action_change()}
          </button>
        )}
      </motion.div>

      <div
        className="mt-4 flex flex-wrap justify-center gap-1.5"
        role="group"
        aria-label="Shortcut presets"
      >
        {SHORTCUT_PRESETS.map((preset) => {
          const selected = preset.accelerator === accelerator;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.accelerator)}
              className={cn(
                "px-2.5 py-1 rounded-md font-mono text-[11px] border transition-colors",
                selected
                  ? "text-primary border-primary/40 bg-primary/5"
                  : "text-muted-foreground border-border hover:text-foreground hover:border-border/80"
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-center text-[12px] text-muted-foreground">
        {m.onboarding_shortcut_hint()}
      </p>
    </div>
  );
}
