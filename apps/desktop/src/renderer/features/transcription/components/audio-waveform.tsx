import { motion } from "motion/react";

interface AudioWaveformProps {
  isActive: boolean;
  barCount?: number;
}

export function AudioWaveform({ isActive, barCount = 5 }: AudioWaveformProps): React.ReactElement {
  const barAnimations = [
    { idle: [6, 10, 6], active: [10, 28, 14, 32, 10] },
    { idle: [8, 14, 8], active: [14, 36, 20, 28, 16] },
    { idle: [12, 18, 12], active: [20, 44, 28, 36, 22] },
    { idle: [8, 14, 8], active: [14, 32, 18, 30, 14] },
    { idle: [6, 10, 6], active: [10, 26, 12, 28, 10] },
  ];

  return (
    <div className="flex items-center justify-center gap-[3px] h-12 px-2" aria-hidden>
      {Array.from({ length: barCount }).map((_, index) => {
        const heights = barAnimations[index % barAnimations.length]!;

        return (
          <motion.div
            key={index}
            className={`w-1 rounded transition-colors duration-300 ${
              isActive ? "bg-success" : "bg-muted-foreground/40"
            }`}
            initial={{ height: 8 }}
            animate={{
              height: isActive ? heights.active : heights.idle,
            }}
            transition={{
              height: {
                duration: isActive ? 0.4 : 1.2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: index * 0.08,
              },
            }}
          />
        );
      })}
    </div>
  );
}
