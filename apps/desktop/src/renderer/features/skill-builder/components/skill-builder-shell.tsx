import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { m } from "~/paraglide/messages";
import { SKILL_BUILDER_STEPS, type SkillBuilderStepId } from "../types";

interface SkillBuilderShellProps {
  open: boolean;
  step: SkillBuilderStepId;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const VISIBLE_STEPS = SKILL_BUILDER_STEPS.filter(
  (s) => s !== "done"
) as readonly SkillBuilderStepId[];

export function SkillBuilderShell({
  open,
  step,
  onClose,
  children,
  footer,
}: SkillBuilderShellProps): React.ReactElement {
  const isDone = step === "done";
  const activeIndex = VISIBLE_STEPS.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-sm" />
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(720px,calc(100vw-48px))] max-h-[calc(100vh-80px)]",
            "-translate-x-1/2 -translate-y-1/2 flex flex-col",
            "rounded-2xl border border-border bg-card shadow-lg overflow-hidden"
          )}
        >
          <div className="flex items-center gap-3 px-6 pt-5 pb-2">
            <span
              className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary"
              aria-hidden
            >
              <Sparkles className="size-4" strokeWidth={1.75} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {m.skill_builder_shell_kicker()}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label={m.onboarding_close_label()}
              className={cn(
                "ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg",
                "text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              )}
            >
              <X className="h-4 w-4" />
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
              <span className="text-xs text-muted-foreground whitespace-nowrap">
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
