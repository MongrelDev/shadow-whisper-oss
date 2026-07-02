import { AlertTriangle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { m } from "~/paraglide/messages";

type PaywallBannerProps = {
  limit: number;
  onUpgrade: () => void;
  onDismiss: () => void;
};

export function PaywallBanner({ limit, onUpgrade, onDismiss }: PaywallBannerProps) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <div className="mb-1 flex items-center gap-2">
        <AlertTriangle className="size-4 shrink-0 text-destructive" strokeWidth={1.75} />
        <p className="text-sm font-semibold text-destructive">{m.billing_paywall_title()}</p>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        {m.billing_paywall_body({ limit: String(limit) })}
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={onUpgrade}>
          {m.billing_paywall_cta()}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          {m.billing_paywall_dismiss()}
        </Button>
      </div>
    </div>
  );
}
