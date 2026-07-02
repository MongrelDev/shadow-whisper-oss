import { motion } from "motion/react";
import { PricingCards } from "@/components/pricing-cards";
import { m } from "~/paraglide/messages";

interface StepPlanFreeProps {
  onSubscribe: (annual: boolean) => void;
  onSkip: () => void;
}

export function StepPlanFree({ onSubscribe, onSkip }: StepPlanFreeProps): React.ReactElement {
  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          {m.onboarding_plan_free_title()}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{m.onboarding_plan_free_subtitle()}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        <PricingCards onSubscribe={onSubscribe} />
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        onClick={onSkip}
        className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {m.onboarding_plan_free_skip()}
      </motion.button>
    </div>
  );
}
