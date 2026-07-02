import { LoadingState } from "@/components/public/status-page";
import { getCurrentLocalizedPath } from "@/lib/paraglide-path";

export default async function PurchaseCancelledLoading(): Promise<React.ReactElement> {
  const currentPath = await getCurrentLocalizedPath();
  return <LoadingState currentPath={currentPath} />;
}
