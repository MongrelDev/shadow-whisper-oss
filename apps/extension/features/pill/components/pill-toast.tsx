import { useLayoutEffect, useRef, useState } from "react";
import type { ToastState, ToastTone } from "~/features/pill/hooks/use-pill-toast";

type Props = { toast: ToastState };

const toneClass: Record<ToastTone, string> = {
  success: "border border-primary/30 bg-card text-primary",
  error: "border border-destructive/30 bg-card text-destructive",
  info: "border border-border/60 bg-card text-foreground",
};

export function PillToast({ toast }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [below, setBelow] = useState(false);
  const message = toast.message;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !message) return;
    const rect = el.getBoundingClientRect();
    setBelow(rect.top < 8);
  }, [message]);

  if (!message) return null;

  const position = below ? { top: "100%", marginTop: 8 } : { bottom: "100%", marginBottom: 8 };

  return (
    <div
      ref={ref}
      role="status"
      style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", ...position }}
      className={`pointer-events-none whitespace-nowrap rounded-md px-2.5 py-1.5 text-center text-xs shadow-lg ${toneClass[toast.tone]}`}
    >
      {message}
    </div>
  );
}
