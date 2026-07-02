import { useMemo } from "react";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import { m } from "~/paraglide/messages";

const DESTINATIONS = ["MAIL", "SLACK", "CURSOR", "NOTION", "GMAIL", "IMESSAGE"];

interface ConfettiPiece {
  left: number;
  color: string;
  duration: number;
  delay: number;
  rotation: number;
  opacity: number;
}

const CONFETTI_COLORS = ["#6b5fd1", "#443f8f", "#7d71e0", "#a79fea", "#ededf5"];

export function StepDone(): React.ReactElement {
  const confetti = useMemo<ConfettiPiece[]>(
    () =>
      Array.from({ length: 48 }, () => ({
        left: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
        duration: 1.8 + Math.random() * 1.4,
        delay: Math.random() * 0.4,
        rotation: Math.random() * 360,
        opacity: 0.6 + Math.random() * 0.4,
      })),
    []
  );

  return (
    <div className="relative flex flex-col items-center text-center py-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((piece, i) => (
          <motion.span
            key={i}
            initial={{ y: -20, opacity: piece.opacity, rotate: piece.rotation }}
            animate={{ y: 460, rotate: piece.rotation + 540, opacity: 0 }}
            transition={{ duration: piece.duration, delay: piece.delay, ease: "linear" }}
            style={{
              left: `${piece.left}%`,
              background: piece.color,
              position: "absolute",
              top: 0,
              width: 6,
              height: 10,
              borderRadius: 1,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--primary) 30%, transparent), transparent 70%)",
        }}
      >
        <Check className="h-9 w-9 text-primary" strokeWidth={2.5} />
      </motion.div>

      <h2 className="mt-5 text-[26px] font-semibold tracking-tight text-foreground">
        {m.onboarding_done_title()}
      </h2>
      <p className="mt-2 max-w-[40ch] text-[13.5px] leading-relaxed text-muted-foreground">
        {m.onboarding_done_subtitle()}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {DESTINATIONS.map((name) => (
          <span
            key={name}
            className="font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground border border-border rounded-full px-2.5 py-1"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
