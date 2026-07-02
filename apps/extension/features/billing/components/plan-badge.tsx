import { cva } from "class-variance-authority";
import { useSubscriptionStatus } from "~/features/billing/hooks/use-subscription-status";
import { m } from "~/paraglide/messages";

const badgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      free: "bg-muted text-muted-foreground",
      pro: "bg-primary/10 text-primary",
      trial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      canceling: "bg-destructive/10 text-destructive",
    },
  },
  defaultVariants: {
    variant: "free",
  },
});

type BadgeVariant = "free" | "pro" | "trial" | "canceling";

function resolveBadgeVariant(
  displayStatus: string,
  plan: string,
  trialEnd: number | null
): BadgeVariant {
  if (displayStatus === "canceling") return "canceling";
  if (trialEnd !== null && displayStatus === "active") return "trial";
  if (displayStatus === "active" && plan === "pro") return "pro";
  return "free";
}

function badgeText(variant: BadgeVariant): string {
  switch (variant) {
    case "free":
      return m.billing_plan_badge_free();
    case "pro":
      return m.billing_plan_badge_pro();
    case "trial":
      return m.billing_plan_badge_trial();
    case "canceling":
      return m.billing_plan_badge_canceling();
  }
}

export function PlanBadge() {
  const { data, isPending } = useSubscriptionStatus();

  if (isPending || !data) return null;

  const variant = resolveBadgeVariant(data.displayStatus, data.plan, data.trialEnd);

  return <span className={badgeVariants({ variant })}>{badgeText(variant)}</span>;
}
