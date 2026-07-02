import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { m } from "~/paraglide/messages";

interface TranscribingPillProps {
  display?: boolean;
  label?: string;
}

export function TranscribingPill({
  display = true,
  label,
}: TranscribingPillProps): React.ReactElement | null {
  if (!display) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 4 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="origin-bottom flex items-center h-10 pl-3 pr-4 gap-2.5 rounded-full bg-card text-card-foreground border border-primary/15 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35),inset_0_0_0_1px_color-mix(in_oklch,var(--color-primary)_6%,transparent)]"
      role="status"
      aria-live="polite"
    >
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="inline-flex text-primary"
        aria-hidden
      >
        <Loader2 className="size-[14px]" strokeWidth={2.2} />
      </motion.span>
      <span className="text-[12px] font-medium tracking-tight text-primary">
        {label ?? m.pill_transcribing_label()}
      </span>
    </motion.div>
  );
}
