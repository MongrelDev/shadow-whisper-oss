import { Navigate } from "@tanstack/react-router";
import { m } from "~/paraglide/messages";
import { useAffiliateEnabled } from "../hooks/use-affiliate";
import { AffiliateDashboardContainer } from "../containers/affiliate-dashboard-container";

export function AffiliatePage(): React.ReactElement {
  const { data: enabled, isLoading } = useAffiliateEnabled();

  if (isLoading) return <div />;
  if (!enabled) return <Navigate to="/app" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {m.affiliate_page_title()}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{m.affiliate_page_subtitle()}</p>
      </div>
      <AffiliateDashboardContainer />
    </div>
  );
}
