import { motion } from "motion/react";
import { AlertCircle } from "lucide-react";
import { PricingCards } from "@/components/pricing-cards";
import { m } from "~/paraglide/messages";

interface StepPlanExpiredProps {
  onSubscribe: (annual: boolean) => void;
  onSkip: () => void;
}

export function StepPlanExpired({ onSubscribe, onSkip }: StepPlanExpiredProps): React.ReactElement {
  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          {m.onboarding_plan_expired_title()}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{m.onboarding_plan_expired_subtitle()}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.25 }}
        className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3"
      >
        <AlertCircle
          className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
          strokeWidth={2}
        />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {m.onboarding_plan_expired_notice()}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        <PricingCards onSubscribe={onSubscribe} />
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.25 }}
        onClick={onSkip}
        className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {m.onboarding_plan_expired_skip()}
      </motion.button>
    </div>
  );
}
