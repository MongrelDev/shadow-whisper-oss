import { useSubscriptionStatus } from "@/hooks/use-user";
import { useCheckout } from "@/hooks/use-checkout";
import { useCheckoutStatusPolling } from "@/hooks/use-checkout-status-polling";
import { StepPlanFree } from "../components/step-plan-free";
import { StepPlanExpired } from "../components/step-plan-expired";
import { StepPlanActive } from "../components/step-plan-active";

interface StepPlanContainerProps {
  onNext: () => void;
}

export function StepPlanContainer({ onNext }: StepPlanContainerProps): React.ReactElement {
  const { data: subscription } = useSubscriptionStatus();
  const { checkoutAsync, isPolling, stopPolling } = useCheckout("onboarding");

  useCheckoutStatusPolling({
    enabled: isPolling,
    origin: "onboarding",
    onUpgraded: stopPolling,
  });

  const displayStatus = subscription?.displayStatus ?? "free";

  const handleCheckout = async (annual: boolean) => {
    await checkoutAsync({ annual }).catch(() => {});
  };

  if (displayStatus === "active") {
    return <StepPlanActive onNext={onNext} />;
  }

  if (displayStatus === "canceled" || displayStatus === "canceling") {
    return <StepPlanExpired onSubscribe={handleCheckout} onSkip={onNext} />;
  }

  return <StepPlanFree onSubscribe={handleCheckout} onSkip={onNext} />;
}
