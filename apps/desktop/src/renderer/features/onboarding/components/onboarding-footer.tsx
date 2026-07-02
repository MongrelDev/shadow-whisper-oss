import { cn } from "@/lib/utils";
import { m } from "~/paraglide/messages";

interface OnboardingFooterProps {
  onBack?: () => void;
  onSkipStep?: () => void;
  onNext: () => void;
  showBack: boolean;
  showSkipStep?: boolean;
  nextLabel: string;
  nextDisabled?: boolean;
}

export function OnboardingFooter({
  onBack,
  onSkipStep,
  onNext,
  showBack,
  showSkipStep = false,
  nextLabel,
  nextDisabled = false,
}: OnboardingFooterProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={!showBack}
        className={cn(
          "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
          "px-2 py-1.5 rounded-md",
          !showBack && "invisible"
        )}
      >
        {m.onboarding_footer_back()}
      </button>
      <div className="flex items-center gap-2">
        {showSkipStep && (
          <button
            type="button"
            onClick={onSkipStep}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg"
          >
            {m.onboarding_footer_skip_step()}
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium",
            "bg-primary text-primary-foreground transition-colors",
            "hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
