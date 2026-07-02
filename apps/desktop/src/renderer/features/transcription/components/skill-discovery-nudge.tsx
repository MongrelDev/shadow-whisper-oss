import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { m } from "~/paraglide/messages";

const AUTO_DISMISS_MS = 6000;

interface SkillDiscoveryNudgeProps {
  onNavigateToSkills: () => void;
  onDismiss: () => void;
}

export function SkillDiscoveryNudge({
  onNavigateToSkills,
  onDismiss,
}: SkillDiscoveryNudgeProps): React.ReactElement {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => {
      if (timerRef.current != null) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <motion.div
      key="skill-discovery-nudge"
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      role="status"
      aria-live="polite"
      className="flex items-center h-10 pl-3 pr-1.5 gap-2.5 rounded-full bg-card text-card-foreground border border-primary/20 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35),inset_0_0_0_1px_color-mix(in_oklch,var(--color-primary)_6%,transparent)]"
    >
      <span className="text-[12.5px] font-medium tracking-tight text-foreground">
        {m.nudge_skill_discovery_title()}
      </span>
      <span className="h-3.5 w-px bg-border/70" aria-hidden />
      <button
        type="button"
        onClick={() => {
          if (timerRef.current != null) clearTimeout(timerRef.current);
          onNavigateToSkills();
        }}
        className="flex items-center h-7 px-2.5 rounded-full bg-primary/10 text-primary text-[12px] font-semibold tracking-tight hover:bg-primary/20 transition-colors"
      >
        {m.nudge_skill_discovery_cta()}
      </button>
    </motion.div>
  );
}
