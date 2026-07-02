import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { m } from "~/paraglide/messages";

interface SkillBuilderFooterProps {
  onBack?: () => void;
  onNext: () => void;
  showBack: boolean;
  nextLabel: string;
  nextDisabled?: boolean;
  nextBusy?: boolean;
}

export function SkillBuilderFooter({
  onBack,
  onNext,
  showBack,
  nextLabel,
  nextDisabled = false,
  nextBusy = false,
}: SkillBuilderFooterProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={!showBack}
        className={cn(!showBack && "invisible")}
      >
        {m.onboarding_footer_back()}
      </Button>
      <Button onClick={onNext} disabled={nextDisabled || nextBusy}>
        {nextLabel}
      </Button>
    </div>
  );
}
