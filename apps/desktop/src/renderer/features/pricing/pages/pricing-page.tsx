import { m } from "~/paraglide/messages";
import { PricingCards } from "@/components/pricing-cards";

export function PricingPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {m.pricing_page_title()}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{m.pricing_page_subtitle()}</p>
      </div>
      <PricingCards />
    </div>
  );
}
