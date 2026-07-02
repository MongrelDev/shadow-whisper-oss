import type { ReactNode } from "react";
import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { PillShortcutChips } from "./pill-shortcut-chips";

type FeedbackTone = "error" | "info";

const pillChrome = cva(
  "origin-bottom flex items-center h-10 pl-3 pr-3.5 gap-2.5 rounded-full bg-card text-card-foreground border",
  {
    variants: {
      tone: {
        error:
          "border-recording/15 shadow-[0_10px_30px_-10px_oklch(0.55_0.22_27/0.08),inset_0_0_0_1px_oklch(0.55_0.22_27/0.05)]",
        info: "border-primary/15 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35),inset_0_0_0_1px_color-mix(in_oklch,var(--color-primary)_6%,transparent)]",
      },
    },
    defaultVariants: { tone: "error" },
  }
);

const dotVariants = cva("size-2 shrink-0 rounded-full", {
  variants: {
    tone: {
      error: "bg-recording shadow-[0_0_6px_oklch(0.55_0.22_27/0.25)]",
      info: "bg-primary shadow-[0_0_6px_color-mix(in_oklch,var(--color-primary)_30%,transparent)]",
    },
  },
  defaultVariants: { tone: "error" },
});

function FeedbackDot({ tone = "error" }: { tone?: FeedbackTone | null }): React.ReactElement {
  return (
    <span className="relative flex size-2.5 items-center justify-center" aria-hidden>
      <motion.span
        className={cn(
          "absolute inset-0 rounded-full",
          tone === "error" ? "bg-recording" : "bg-primary"
        )}
        animate={{ opacity: [0.3, 0, 0.3], scale: [1, 1.5, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className={dotVariants({ tone })} />
    </span>
  );
}

interface FeedbackPillRootProps extends VariantProps<typeof pillChrome> {
  display?: boolean;
  children: ReactNode;
}

function Root({
  display = true,
  tone = "error",
  children,
}: FeedbackPillRootProps): React.ReactElement | null {
  if (!display) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: [0, -3, 2, -1, 0] }}
      exit={{ opacity: 0, scale: 0.94, y: 4 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={pillChrome({ tone })}
      role="alert"
      aria-live="polite"
    >
      <FeedbackDot tone={tone} />
      {children}
    </motion.div>
  );
}

function Reason({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: FeedbackTone;
}): React.ReactElement {
  return (
    <span
      className={cn(
        "text-[12px] font-medium tracking-tight whitespace-nowrap",
        tone === "error" ? "text-recording-foreground" : "text-foreground"
      )}
    >
      {children}
    </span>
  );
}

function Separator(): React.ReactElement {
  return <span className="h-3.5 w-px shrink-0 bg-border" aria-hidden />;
}

function Hint({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-medium tracking-tight text-muted-foreground whitespace-nowrap">
      {children}
    </span>
  );
}

function ShortcutChips({ keys }: { keys: string[] }): React.ReactElement {
  return <PillShortcutChips keys={keys} size="xs" tone="subtle" textColor="foreground" />;
}

interface ActionProps {
  onClick: () => void;
  children: ReactNode;
  // `undefined` → default retry icon. `null` → no icon.
  icon?: ReactNode | null;
}

function Action({ onClick, children, icon }: ActionProps): React.ReactElement {
  const resolvedIcon =
    icon === undefined ? <RotateCcw className="size-3" strokeWidth={2.2} aria-hidden /> : icon;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className="relative inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/50 px-2 py-[3px] text-[12px] font-medium tracking-tight text-foreground transition-colors before:absolute before:-inset-1.5 before:content-[''] hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60"
    >
      {resolvedIcon}
      {children}
    </motion.button>
  );
}

export const FeedbackPill = Object.assign(Root, {
  Reason,
  Separator,
  Hint,
  Action,
  ShortcutChips,
});
