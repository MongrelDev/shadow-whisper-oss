import type { Metadata } from "next";

import { StatusPage } from "@/components/public/status-page";
import { getCurrentLocalizedPath } from "@/lib/paraglide-path";
import { siteConfig } from "@/lib/site";
import { m } from "~/paraglide/messages";

export const metadata: Metadata = {
  title: "Algo saiu do fluxo",
  description: "Pagina generica de erro do Shadow Whisper.",
};

export default async function ErrorPage(): Promise<React.ReactElement> {
  const currentPath = await getCurrentLocalizedPath();
  return (
    <StatusPage
      tone="error"
      title={m.error_page_title()}
      description={m.error_page_description_generic()}
      primaryAction={{ href: "/", label: m.error_page_back_home() }}
      secondaryAction={{ href: `mailto:${siteConfig.supportEmail}`, label: m.error_page_support() }}
      currentPath={currentPath}
    />
  );
}
