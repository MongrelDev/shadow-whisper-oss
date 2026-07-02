import { StatusPage } from "@/components/public/status-page";
import { getCurrentLocalizedPath } from "@/lib/paraglide-path";
import { m } from "~/paraglide/messages";

export default async function NotFoundPage(): Promise<React.ReactElement> {
  const currentPath = await getCurrentLocalizedPath();
  return (
    <StatusPage
      tone="not-found"
      title={m.not_found_title()}
      description={m.not_found_description()}
      primaryAction={{ href: "/", label: m.error_page_back_home() }}
      currentPath={currentPath}
    />
  );
}
