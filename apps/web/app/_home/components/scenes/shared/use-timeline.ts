import { useEffect, useRef, useState } from "react";

export type TimelineStep = { at: number; run: () => void };

export function useTimeline(steps: TimelineStep[], totalMs: number, paused: boolean): number {
  const [tick, setTick] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const latest = useRef({ steps, totalMs });

  useEffect(() => {
    latest.current = { steps, totalMs };
  });

  useEffect(() => {
    if (paused) return;

    const { steps: currentSteps, totalMs: currentTotalMs } = latest.current;
    currentSteps.forEach((step) => {
      timers.current.push(setTimeout(step.run, step.at));
    });
    timers.current.push(setTimeout(() => setTick((t) => t + 1), currentTotalMs));

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [tick, paused]);

  return tick;
}
