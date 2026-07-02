import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";

import { PublicShell } from "@/components/public/public-shell";
import { buttonVariants } from "@/components/ui/button";
import { compactParam, type SearchParams } from "@/lib/search-params";
import {
  buildLanguageAlternates,
  getCurrentLocalizedPath,
  getRequestLocale,
  openGraphLocaleFor,
} from "@/lib/paraglide-path";
import { siteConfig } from "@/lib/site";
import { getLocale } from "~/paraglide/runtime";
import { m } from "~/paraglide/messages";

export async function generateMetadata(): Promise<Metadata> {
  const currentPath = await getCurrentLocalizedPath();
  const locale = await getRequestLocale();
  return {
    title: locale === "pt-BR" ? "Compra cancelada" : "Purchase cancelled",
    description:
      locale === "pt-BR"
        ? "Retorno de checkout cancelado do Shadow Whisper."
        : "Shadow Whisper checkout cancellation.",
    alternates: {
      canonical: currentPath,
      languages: buildLanguageAlternates("/purchase/cancelled"),
    },
    openGraph: {
      locale: openGraphLocaleFor(locale),
      alternateLocale: locale === "en" ? ["pt_BR"] : ["en_US"],
    },
  };
}

interface PurchaseCancelledPageProps {
  searchParams: Promise<SearchParams>;
}

async function CancelledDetails({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<React.ReactElement | null> {
  const params = await searchParams;
  const sessionId = compactParam(params.session_id);

  if (!sessionId) return null;

  return (
    <dl className="mt-12 grid grid-cols-[5.5rem_1fr] gap-x-5 gap-y-2.5 border-t border-border/60 pt-7 text-[13px] leading-6">
      <dt className="font-mono uppercase tracking-[0.2em] text-muted-foreground">
        {m.purchase_cancelled_status_label()}
      </dt>
      <dd className="text-foreground">{m.purchase_cancelled_status_value()}</dd>
      <dt className="font-mono uppercase tracking-[0.2em] text-muted-foreground">
        {getLocale() === "pt-BR" ? "Stripe" : "Stripe"}
      </dt>
      <dd className="truncate font-mono text-muted-foreground">{sessionId}</dd>
    </dl>
  );
}

export default async function PurchaseCancelledPage({
  searchParams,
}: PurchaseCancelledPageProps): Promise<React.ReactElement> {
  const currentPath = await getCurrentLocalizedPath();

  return (
    <PublicShell eyebrow={m.purchase_cancelled_eyebrow()} currentPath={currentPath}>
      <div className="relative flex flex-1 items-start py-12 lg:py-16">
        <section className="max-w-2xl" role="status">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <span className="h-px w-10 bg-foreground/30" aria-hidden="true" />
            <span>{m.purchase_cancelled_subtitle()}</span>
          </div>

          <h1 className="mt-7 text-[clamp(2.75rem,7vw,5rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-balance">
            {m.purchase_cancelled_title_ok()}
            <br />
            <span className="text-muted-foreground/70">
              {m.purchase_cancelled_title_nocharge()}
              <span className="text-primary">.</span>
            </span>
          </h1>

          <p className="mt-7 max-w-[48ch] text-[15px] leading-[1.7] text-muted-foreground">
            {m.purchase_cancelled_description()}
          </p>

          <Suspense fallback={null}>
            <CancelledDetails searchParams={searchParams} />
          </Suspense>

          <div className="mt-10 flex flex-col gap-3 border-t border-border/60 pt-8 sm:flex-row">
            <Link href="/" className={buttonVariants({ size: "lg" })}>
              {m.purchase_cancelled_back_home()}
            </Link>
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {m.purchase_cancelled_contact_team()}
            </a>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
