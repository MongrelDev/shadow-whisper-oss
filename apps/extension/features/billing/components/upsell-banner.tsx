import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { m } from "~/paraglide/messages";

export function UpsellBanner(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <article className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/[0.08] via-primary/[0.04] to-transparent p-3">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold tracking-tight text-foreground">
            {m.billing_upgrade_title()}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {m.billing_upgrade_subtitle()}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => void navigate({ to: "/settings", hash: "billing" })}
          className="h-7 shrink-0 gap-1 px-2.5 text-[11px] font-semibold"
        >
          {m.home_upsell_cta()}
          <ArrowRight className="size-3" strokeWidth={2} />
        </Button>
      </div>
    </article>
  );
}
