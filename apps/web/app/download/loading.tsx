import { LoadingState } from "@/components/public/status-page";
import { getCurrentLocalizedPath } from "@/lib/paraglide-path";

export default async function DownloadLoading(): Promise<React.ReactElement> {
  const currentPath = await getCurrentLocalizedPath();
  return <LoadingState currentPath={currentPath} />;
}
