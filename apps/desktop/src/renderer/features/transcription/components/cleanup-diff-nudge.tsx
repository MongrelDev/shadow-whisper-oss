import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Sparkles, AlignLeft } from "lucide-react";
import { m } from "~/paraglide/messages";
import { acceleratorToDisplay } from "@/lib/accelerator";
import { PillShortcutChips } from "./pill-shortcut-chips";

const AUTO_DISMISS_MS = 8000;

interface CleanupDiffNudgeProps {
  shortcutAccelerator: string;
  onOpenDiff: () => void;
  onDismiss: () => void;
}

export function CleanupDiffNudge({
  shortcutAccelerator,
  onOpenDiff,
  onDismiss,
}: CleanupDiffNudgeProps): React.ReactElement {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => {
      if (timerRef.current != null) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  const shortcutKeys = shortcutAccelerator ? acceleratorToDisplay(shortcutAccelerator) : [];
  const hasShortcut = shortcutKeys.length > 0;

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleClick = (): void => {
    if (timerRef.current != null) clearTimeout(timerRef.current);
    onOpenDiff();
  };

  return (
    <motion.div
      key="cleanup-diff-nudge"
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      role="status"
      aria-live="polite"
      className="flex h-10 items-center gap-3 rounded-full border border-white/8 bg-gradient-to-b from-[#1a1a26] to-[#0d0d16] pl-[13px] pr-[6px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7),inset_0_0_0_1px_rgba(255,255,255,0.02)]"
    >
      <span className="inline-flex text-primary/80">
        <Sparkles className="size-[14px]" strokeWidth={2} aria-hidden />
      </span>
      <span className="text-[12.5px] font-medium tracking-[-0.005em] text-foreground">
        {m.nudge_cleanup_diff_label()}
      </span>
      <span className="h-3.5 w-px bg-white/8" aria-hidden />
      {hasShortcut ? (
        <ShortcutHint keys={shortcutKeys} onClick={handleClick} />
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-[5px] rounded-md border border-white/6 bg-white/5 px-2 py-[3px] text-[12.5px] tracking-[-0.005em] text-foreground transition-colors hover:bg-white/10"
        >
          <AlignLeft className="size-[10px] opacity-70" strokeWidth={2.2} aria-hidden />
          {m.nudge_cleanup_diff_cta()}
        </button>
      )}
    </motion.div>
  );
}

function ShortcutHint({
  keys,
  onClick,
}: {
  keys: string[];
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-[5px] rounded-md border border-white/6 bg-white/5 px-2 py-[3px] text-foreground transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60"
    >
      <AlignLeft className="size-[10px] opacity-70" strokeWidth={2.2} aria-hidden />
      <span className="text-[12.5px] tracking-[-0.005em]">{m.nudge_cleanup_diff_cta()}</span>
      <PillShortcutChips keys={keys} size="xs" tone="subtle" textColor="foreground" />
    </button>
  );
}
