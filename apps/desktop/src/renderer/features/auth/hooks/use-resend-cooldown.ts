import { useEffect, useState } from "react";

export interface ResendCooldown {
  isCoolingDown: boolean;
  start: () => void;
}

export function useResendCooldown(durationSeconds = 60): ResendCooldown {
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const secondsLeft =
    cooldownEndsAt === null ? 0 : Math.max(0, Math.ceil((cooldownEndsAt - now) / 1000));
  const isCoolingDown = secondsLeft > 0;

  useEffect(() => {
    if (!isCoolingDown) return;

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isCoolingDown]);

  const start = () => {
    const endsAt = Date.now() + durationSeconds * 1000;
    setNow(Date.now());
    setCooldownEndsAt(endsAt);
  };

  return {
    isCoolingDown,
    start,
  };
}
