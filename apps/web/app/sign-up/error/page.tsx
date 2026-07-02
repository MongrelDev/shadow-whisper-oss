import { Suspense } from "react";
import type { Metadata } from "next";

import { StatusPage } from "@/components/public/status-page";
import { compactParam, type SearchParams } from "@/lib/search-params";
import { getCurrentLocalizedPath } from "@/lib/paraglide-path";
import { siteConfig } from "@/lib/site";
import { m } from "~/paraglide/messages";

export const metadata: Metadata = {
  title: "Erro no cadastro",
  description: "Erro no fluxo de cadastro do Shadow Whisper.",
};

interface SignUpErrorPageProps {
  searchParams: Promise<SearchParams>;
}

async function SignUpErrorContent({
  searchParams,
  currentPath,
}: {
  searchParams: Promise<SearchParams>;
  currentPath: string;
}): Promise<React.ReactElement> {
  const params = await searchParams;
  const reason = compactParam(params.reason);
  const reasonCopy: Record<string, string> = {
    network: m.signup_error_reason_network(),
    server: m.signup_error_reason_server(),
  };
  const description = (reason && reasonCopy[reason]) ?? m.signup_error_fallback();

  return (
    <StatusPage
      tone="error"
      title={m.signup_error_title()}
      description={description}
      primaryAction={{ href: "/sign-up", label: m.signup_error_retry() }}
      secondaryAction={{
        href: `mailto:${siteConfig.supportEmail}`,
        label: m.signup_error_contact_support(),
      }}
      currentPath={currentPath}
    />
  );
}

export default async function SignUpErrorPage({
  searchParams,
}: SignUpErrorPageProps): Promise<React.ReactElement> {
  const currentPath = await getCurrentLocalizedPath();
  return (
    <Suspense
      fallback={
        <StatusPage
          tone="error"
          title={m.signup_error_title()}
          description={m.signup_error_fallback()}
          primaryAction={{ href: "/sign-up", label: m.signup_error_retry() }}
          secondaryAction={{
            href: `mailto:${siteConfig.supportEmail}`,
            label: m.signup_error_contact_support(),
          }}
          currentPath={currentPath}
        />
      }
    >
      <SignUpErrorContent searchParams={searchParams} currentPath={currentPath} />
    </Suspense>
  );
}
