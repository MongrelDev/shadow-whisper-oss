import { Crown, Key, Sparkles } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { Plan, DisplayStatus } from "../../../../shared/ipc-types";

const PLAN_CONFIG = {
  free: { label: "Gratuito", icon: Sparkles, color: "text-muted-foreground", bg: "bg-muted" },
  pro: { label: "Standard Pro", icon: Crown, color: "text-primary", bg: "bg-primary/10" },
  byok: { label: "BYOK", icon: Key, color: "text-primary", bg: "bg-primary/10" },
} as const satisfies Record<
  Plan,
  { label: string; icon: React.ElementType; color: string; bg: string }
>;

const badgeVariants = cva("rounded-full px-2 py-0.5 text-[10px] font-semibold", {
  variants: {
    status: {
      active: "bg-primary/10 text-primary",
      canceling: "bg-amber-500/10 text-amber-600",
      canceled: "bg-muted text-muted-foreground",
    },
  },
});

interface PlanHeaderProps {
  plan: Plan;
  displayStatus: DisplayStatus;
  periodEndDate: string | null;
}

export function PlanHeader({
  plan,
  displayStatus,
  periodEndDate,
}: PlanHeaderProps): React.ReactElement {
  const config = PLAN_CONFIG[plan];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", config.bg)}>
          <Icon className={cn("h-3.5 w-3.5", config.color)} strokeWidth={2} />
        </div>
        <span className="text-sm font-semibold text-foreground">{config.label}</span>
        <PlanBadge displayStatus={displayStatus} periodEndDate={periodEndDate} />
      </div>
      <PlanDetail plan={plan} displayStatus={displayStatus} />
    </div>
  );
}

function PlanBadge({
  displayStatus,
  periodEndDate,
}: {
  displayStatus: DisplayStatus;
  periodEndDate: string | null;
}): React.ReactElement | null {
  if (displayStatus === "free") return null;

  if (displayStatus === "active") {
    return <span className={badgeVariants({ status: "active" })}>Ativo</span>;
  }

  if (displayStatus === "canceling") {
    const label = periodEndDate ? `Cancela em ${periodEndDate}` : "Cancelando";
    return <span className={badgeVariants({ status: "canceling" })}>{label}</span>;
  }

  if (displayStatus === "canceled") {
    return <span className={badgeVariants({ status: "canceled" })}>Cancelado</span>;
  }

  return null;
}

function PlanDetail({
  plan,
  displayStatus,
}: {
  plan: Plan;
  displayStatus: DisplayStatus;
}): React.ReactElement | null {
  if (plan === "free" || displayStatus === "canceled") {
    return <span className="text-xs text-muted-foreground">2.000 palavras/semana</span>;
  }

  if (plan === "pro") {
    return <span className="text-xs text-muted-foreground">Palavras ilimitadas</span>;
  }

  return null;
}
