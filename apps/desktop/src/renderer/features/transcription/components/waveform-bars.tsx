import { motion } from "motion/react";

const BAR_COUNT = 7;
const CENTER = Math.floor(BAR_COUNT / 2);

function barWeight(index: number): number {
  const distance = Math.abs(index - CENTER) / CENTER;
  return 1 - distance * 0.5;
}

function IdleBar({ index }: { index: number }): React.ReactElement {
  return (
    <motion.div
      className="w-[2px] rounded-full"
      style={{ backgroundColor: "currentColor", height: 3 }}
      animate={{ opacity: [0.25, 0.55, 0.25] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.15,
      }}
    />
  );
}

function ProcessingBar({ index }: { index: number }): React.ReactElement {
  return (
    <motion.div
      className="w-[2px] rounded-full"
      style={{ backgroundColor: "currentColor", height: 3 }}
      animate={{
        height: [3, 10, 3],
        opacity: [0.4, 0.9, 0.4],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.1,
      }}
    />
  );
}

function SpeakingBar({
  index,
  volumeLevel,
}: {
  index: number;
  volumeLevel: number;
}): React.ReactElement {
  const weight = barWeight(index);
  const barHeight = 3 + volumeLevel * weight * 13;

  return (
    <motion.div
      className="w-[2px] rounded-full"
      style={{ backgroundColor: "currentColor" }}
      animate={{
        height: barHeight,
        opacity: 0.7 + volumeLevel * weight * 0.3,
      }}
      transition={{
        type: "spring",
        damping: 14,
        stiffness: 300,
        mass: 0.3,
      }}
    />
  );
}

interface WaveformBarsProps {
  isSpeaking: boolean;
  isProcessing: boolean;
  volumeLevel: number;
}

export function WaveformBars({
  isSpeaking,
  isProcessing,
  volumeLevel,
}: WaveformBarsProps): React.ReactElement {
  return (
    <div className="flex items-center justify-center gap-[2.5px] flex-1 h-full" aria-hidden>
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        if (isProcessing) return <ProcessingBar key={i} index={i} />;
        if (isSpeaking) return <SpeakingBar key={i} index={i} volumeLevel={volumeLevel} />;
        return <IdleBar key={i} index={i} />;
      })}
    </div>
  );
}
