import { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { LocaleFlagSwitcher } from "@/components/locale-flag-switcher";
import { m } from "~/paraglide/messages";
import { ONBOARDING_STEPS, type OnboardingStepId } from "../types";

interface OnboardingShellProps {
  open: boolean;
  step: OnboardingStepId;
  onOpenChange: (open: boolean) => void;
  onSkipAll: () => void;
  showSkipAsClose: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const VISIBLE_STEPS = ONBOARDING_STEPS.filter((s) => s !== "done") as readonly OnboardingStepId[];

export function OnboardingShell({
  open,
  step,
  onOpenChange,
  onSkipAll,
  showSkipAsClose,
  children,
  footer,
}: OnboardingShellProps): React.ReactElement {
  const isDone = step === "done";
  const activeIndex = VISIBLE_STEPS.indexOf(step);

  // Prevent closing via ESC/overlay click — the skip/close button is the escape hatch.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.stopPropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(640px,calc(100vw-48px))] max-h-[calc(100vh-80px)]",
            "-translate-x-1/2 -translate-y-1/2 flex flex-col",
            "rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          )}
        >
          <div className="flex items-center gap-3 px-6 pt-5 pb-2">
            <OnboardingBrandMark />
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {m.onboarding_brand_first_run()}
            </span>
            <LocaleFlagSwitcher size="sm" className="ml-auto" />
            <button
              type="button"
              onClick={onSkipAll}
              aria-label={
                showSkipAsClose ? m.onboarding_close_label() : m.onboarding_shell_skip_setup()
              }
              className={cn(
                "inline-flex items-center justify-center",
                "font-mono text-[11px] uppercase tracking-[0.18em]",
                "text-muted-foreground hover:text-foreground transition-colors",
                showSkipAsClose ? "h-8 w-8 rounded-lg hover:bg-accent" : "px-2 py-1"
              )}
            >
              {showSkipAsClose ? <X className="h-4 w-4" /> : m.onboarding_shell_skip_setup()}
            </button>
          </div>

          {!isDone && (
            <div className="flex items-center justify-between px-6 pb-3">
              <div
                className="flex items-center gap-2"
                role="progressbar"
                aria-valuenow={activeIndex + 1}
                aria-valuemax={VISIBLE_STEPS.length}
              >
                {VISIBLE_STEPS.map((stepId, i) => {
                  const isActive = i === activeIndex;
                  const isDoneDot = i < activeIndex;
                  return (
                    <span
                      key={stepId}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        isActive
                          ? "w-6 bg-foreground"
                          : isDoneDot
                            ? "w-1.5 bg-primary"
                            : "w-1.5 bg-border"
                      )}
                    />
                  );
                })}
              </div>
              <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground whitespace-nowrap">
                {activeIndex + 1} / {VISIBLE_STEPS.length}
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          {footer && (
            <div className="border-t border-border/60 bg-background/40 px-6 py-3">{footer}</div>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

function OnboardingBrandMark() {
  return (
    <span className="h-5 w-5 text-primary" aria-hidden="true">
      <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <g transform="translate(0,128) scale(0.1,-0.1)">
          <rect x="130" y="520" width="60" height="240" rx="30" />
          <rect x="290" y="440" width="60" height="400" rx="30" />
          <rect x="450" y="240" width="60" height="800" rx="30" />
          <rect x="610" y="520" width="60" height="240" rx="30" />
          <rect x="770" y="357" width="60" height="566" rx="30" />
          <rect x="930" y="240" width="60" height="800" rx="30" />
          <rect x="1090" y="520" width="60" height="240" rx="30" />
        </g>
      </svg>
    </span>
  );
}
