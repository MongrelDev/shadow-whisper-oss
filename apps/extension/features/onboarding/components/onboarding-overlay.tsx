import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { useLocalePreference } from "~/providers/locale-provider";
import { m } from "~/paraglide/messages";
import { WelcomeStep } from "./steps/welcome-step";
import { MicrophoneStep } from "./steps/microphone-step";
import { ShortcutStep } from "./steps/shortcut-step";
import { SkillsStep } from "./steps/skills-step";
import { DoneStep } from "./steps/done-step";

type Step = "welcome" | "microphone" | "shortcut" | "skills" | "done";

const STEPS: Step[] = ["welcome", "microphone", "shortcut", "skills", "done"];

const STEP_LABELS: Record<Step, string> = {
  welcome: "Welcome",
  microphone: "Microphone",
  shortcut: "Recording",
  skills: "Skills",
  done: "Done",
};

function LocaleFlagSwitcher() {
  const { locale, setLocale } = useLocalePreference();
  return (
    <div className="flex gap-0.5">
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={cn(
          "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
          locale === "en"
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground/60 hover:text-muted-foreground"
        )}
      >
        🇺🇸 EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("pt-BR")}
        className={cn(
          "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
          locale === "pt-BR"
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground/60 hover:text-muted-foreground"
        )}
      >
        🇧🇷 PT
      </button>
    </div>
  );
}

function StepContent({ step }: { step: Step }) {
  if (step === "welcome") return <WelcomeStep />;
  if (step === "microphone") return <MicrophoneStep />;
  if (step === "shortcut") return <ShortcutStep />;
  if (step === "skills") return <SkillsStep />;
  return <DoneStep />;
}

interface HeaderActionsProps {
  step: Step;
  isDone: boolean;
  onSkip: () => void;
}

function HeaderActions({ step, isDone, onSkip }: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {step === "welcome" && <LocaleFlagSwitcher />}
      {!isDone && (
        <button
          type="button"
          onClick={onSkip}
          className="px-2 py-1 text-[11px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
        >
          {m.onboarding_skip()}
        </button>
      )}
    </div>
  );
}

interface OnboardingOverlayProps {
  onComplete: () => void;
}

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [step, setStep] = useState<Step>("welcome");
  const overlayRef = useRef<HTMLDivElement>(null);
  const currentIndex = STEPS.indexOf(step);
  const isDone = step === "done";
  const progressPct = ((currentIndex + 1) / STEPS.length) * 100;

  function goNext() {
    const next = STEPS[currentIndex + 1];
    if (next) setStep(next);
  }

  function getFocusableElements(): HTMLElement[] {
    if (!overlayRef.current) return [];
    return Array.from(
      overlayRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  function handleTab(e: KeyboardEvent) {
    const focusable = getFocusableElements();
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setStep("done");
    else if (e.key === "Tab") handleTab(e);
  }, []);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    el.addEventListener("keydown", handleKeyDown);
    getFocusableElements()[0]?.focus();
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [step, handleKeyDown]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding"
    >
      {/* Thin editorial progress line */}
      <div
        className="h-[2px] w-full flex-shrink-0 bg-border"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={0}
        aria-valuemax={STEPS.length}
        aria-label="Onboarding progress"
      >
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between px-5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] font-medium tracking-widest text-muted-foreground/50">
            {String(currentIndex + 1).padStart(2, "0")}/{STEPS.length}
          </span>
          <span className="text-[10px] text-border">·</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
            {STEP_LABELS[step]}
          </span>
        </div>
        <HeaderActions step={step} isDone={isDone} onSkip={() => setStep("done")} />
      </div>

      {/* Step content — overlay owns all navigation, steps are content-only */}
      <div
        key={step}
        className="animate-in fade-in slide-in-from-right-3 duration-200 flex-1 overflow-y-auto"
      >
        <StepContent step={step} />
      </div>

      {/* Sticky footer */}
      <div className="flex-shrink-0 px-5 pb-6 pt-2">
        <button
          type="button"
          onClick={isDone ? onComplete : goNext}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
        >
          {isDone ? m.onboarding_done_cta() : m.onboarding_next()}
        </button>
      </div>
    </div>
  );
}
