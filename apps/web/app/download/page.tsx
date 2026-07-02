import { Suspense } from "react";
import type { Metadata } from "next";

import { PublicShell } from "@/components/public/public-shell";
import { compactParam, type SearchParams } from "@/lib/search-params";
import {
  buildLanguageAlternates,
  getCurrentLocalizedPath,
  getRequestLocale,
  openGraphLocaleFor,
} from "@/lib/paraglide-path";
import { m } from "~/paraglide/messages";

import { DownloadList } from "./_components/download-list";
import { EmailVerifyNotice } from "./_components/email-verify-notice";

export async function generateMetadata(): Promise<Metadata> {
  const currentPath = await getCurrentLocalizedPath();
  const locale = await getRequestLocale();
  return {
    title: "Baixar o Shadow Whisper",
    description: "Baixe o Shadow Whisper para o seu sistema operacional.",
    alternates: {
      canonical: currentPath,
      languages: buildLanguageAlternates("/download"),
    },
    openGraph: {
      locale: openGraphLocaleFor(locale),
      alternateLocale: locale === "en" ? ["pt_BR"] : ["en_US"],
    },
  };
}

interface DownloadPageProps {
  searchParams: Promise<SearchParams>;
}

async function EmailVerifyNoticeBlock({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<React.ReactElement | null> {
  const params = await searchParams;
  const email = compactParam(params.email);
  if (!email) return null;

  return <EmailVerifyNotice email={email} />;
}

function DownloadShell({
  children,
  currentPath,
}: {
  children: React.ReactNode;
  currentPath: string;
}): React.ReactElement {
  return (
    <PublicShell eyebrow={m.download_eyebrow()} currentPath={currentPath}>
      <div className="relative grid flex-1 items-start gap-12 py-12 md:grid-cols-[1fr_400px] lg:grid-cols-[1fr_440px] lg:gap-20 lg:py-16">
        <section className="max-w-2xl">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <span className="h-px w-10 bg-foreground/30" aria-hidden="true" />
            <span>{m.download_version_tag()}</span>
          </div>

          <h1 className="mt-7 text-[clamp(2.75rem,7vw,5rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-balance">
            {m.download_title_ready()}
            <br />
            <span className="text-muted-foreground/70">{m.download_title_pick()}</span>
            <br />
            {m.download_title_system()}
            <span className="text-primary">.</span>
          </h1>

          <p className="mt-7 max-w-[48ch] text-[15px] leading-[1.7] text-muted-foreground">
            {m.download_description()}
          </p>

          {children}
        </section>

        <section aria-label={m.download_section_aria()} className="w-full">
          <DownloadList
            labels={{
              heading: m.download_list_heading(),
              variants: m.download_list_variants(),
              recommended: m.download_list_recommended(),
              soon: m.download_list_soon(),
              help: m.download_list_help(),
            }}
          />
        </section>
      </div>
    </PublicShell>
  );
}

export default async function DownloadPage({
  searchParams,
}: DownloadPageProps): Promise<React.ReactElement> {
  const currentPath = await getCurrentLocalizedPath();
  return (
    <DownloadShell currentPath={currentPath}>
      <Suspense fallback={null}>
        <EmailVerifyNoticeBlock searchParams={searchParams} />
      </Suspense>
    </DownloadShell>
  );
}
