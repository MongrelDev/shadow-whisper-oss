import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { m } from "~/paraglide/messages";

interface UpsellBannerProps {
  onAction: () => void;
}

export function UpsellBanner({ onAction }: UpsellBannerProps): React.ReactElement {
  return (
    <article className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/[0.08] via-primary/[0.04] to-transparent p-4">
      <div className="flex items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            {m.home_upsell_title()}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {m.home_upsell_subtitle()}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={onAction}
          className="h-8 shrink-0 px-3 text-xs font-semibold"
        >
          {m.home_upsell_cta()}
          <ArrowRight className="size-3.5" strokeWidth={1.75} />
        </Button>
      </div>
    </article>
  );
}
