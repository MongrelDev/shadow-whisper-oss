import { useEffect, useRef } from "react";

export type TimelineStep = { at: number; run: () => void };

export function useTimeline(steps: TimelineStep[], totalMs: number, paused: boolean): void {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stepsRef = useRef(steps);
  const totalRef = useRef(totalMs);

  stepsRef.current = steps;
  totalRef.current = totalMs;

  useEffect(() => {
    if (paused) return;

    const currentSteps = stepsRef.current;
    const currentTotal = totalRef.current;

    currentSteps.forEach((step) => {
      timers.current.push(setTimeout(step.run, step.at));
    });
    timers.current.push(setTimeout(() => {}, currentTotal));

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [paused]);
}
