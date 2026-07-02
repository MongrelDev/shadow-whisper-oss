import { Suspense } from "react";
import type { Metadata } from "next";

import { PublicShell } from "@/components/public/public-shell";
import { compactParam, type SearchParams } from "@/lib/search-params";
import { PurchaseSuccessAutoRedirect } from "./_components/purchase-success-auto-redirect";
import {
  buildLanguageAlternates,
  getCurrentLocalizedPath,
  getRequestLocale,
  openGraphLocaleFor,
} from "@/lib/paraglide-path";
import { siteConfig } from "@/lib/site";
import { m } from "~/paraglide/messages";
import { getLocale } from "~/paraglide/runtime";

export async function generateMetadata(): Promise<Metadata> {
  const currentPath = await getCurrentLocalizedPath();
  const locale = await getRequestLocale();
  return {
    title: locale === "pt-BR" ? "Compra confirmada" : "Purchase confirmed",
    description:
      locale === "pt-BR"
        ? "Confirmação de compra do Shadow Whisper."
        : "Shadow Whisper purchase confirmation.",
    alternates: {
      canonical: currentPath,
      languages: buildLanguageAlternates("/purchase/success"),
    },
    openGraph: {
      locale: openGraphLocaleFor(locale),
      alternateLocale: locale === "en" ? ["pt_BR"] : ["en_US"],
    },
  };
}

interface PurchaseSuccessPageProps {
  searchParams: Promise<SearchParams>;
}

async function PurchaseDetails({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<React.ReactElement | null> {
  const params = await searchParams;
  const sessionId = compactParam(params.session_id);
  const customerEmail = compactParam(params.email);

  if (!sessionId && !customerEmail) {
    return (
      <p className="mt-8 text-[13px] text-muted-foreground/60">
        {getLocale() === "pt-BR"
          ? "Detalhes da compra não disponíveis no momento."
          : "Purchase details not available at the moment."}
      </p>
    );
  }

  return (
    <dl className="mt-12 grid grid-cols-[5.5rem_1fr] gap-x-5 gap-y-2.5 border-t border-border/60 pt-7 text-[13px] leading-6">
      {customerEmail ? (
        <>
          <dt className="font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {m.purchase_success_details_email_label()}
          </dt>
          <dd className="truncate text-foreground">{customerEmail}</dd>
        </>
      ) : null}
      {sessionId ? (
        <>
          <dt className="font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {m.purchase_success_details_stripe_label()}
          </dt>
          <dd className="truncate font-mono text-muted-foreground">{sessionId}</dd>
        </>
      ) : null}
    </dl>
  );
}

function PurchaseSuccessShell({
  children,
  currentPath,
}: {
  children: React.ReactNode;
  currentPath: string;
}): React.ReactElement {
  const nextSteps = [
    {
      title: m.purchase_success_step_receipt_title(),
      description: m.purchase_success_step_receipt_description(),
    },
    {
      title: m.purchase_success_step_sync_title(),
      description: m.purchase_success_step_sync_description(),
    },
    {
      title: m.purchase_success_step_app_title(),
      description: m.purchase_success_step_app_description(),
    },
  ];

  return (
    <PublicShell eyebrow={m.purchase_success_eyebrow()} currentPath={currentPath}>
      <div className="relative grid flex-1 items-start gap-12 py-12 md:grid-cols-[1fr_400px] lg:grid-cols-[1fr_440px] lg:gap-20 lg:py-16">
        <section className="max-w-2xl" role="status">
          <h1 className="text-[clamp(2.75rem,7vw,5rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-balance">
            {m.purchase_success_title_thanks()}
            <br />
            <span className="text-muted-foreground/70">{m.purchase_success_title_plan()}</span>
            <br />
            {m.purchase_success_title_active()}
            <span className="text-primary">.</span>
          </h1>

          <p className="mt-7 max-w-[48ch] text-[15px] leading-[1.7] text-muted-foreground">
            {m.purchase_success_description()}
          </p>

          {children}
        </section>

        <section aria-label={m.purchase_success_steps_aria()} className="w-full">
          <div className="relative isolate overflow-hidden rounded-xl border border-border/70 bg-background/75 shadow-[0_30px_80px_-60px_color-mix(in_oklch,var(--color-primary)_60%,black)] backdrop-blur-sm">
            <header className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-3.5 sm:px-6">
              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                <span className="h-px w-6 bg-foreground/30" aria-hidden="true" />
                <span>{m.purchase_success_steps_heading()}</span>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                <span className="text-foreground">{nextSteps.length}</span>{" "}
                {m.purchase_success_steps_suffix()}
              </p>
            </header>

            <ol>
              {nextSteps.map((step, index) => (
                <li
                  key={step.title}
                  className="border-b border-border/60 px-5 py-6 last:border-b-0 sm:px-6"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="w-5 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-semibold tracking-tight text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-[13.5px] leading-[1.65] text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <footer className="flex flex-col gap-1.5 border-t border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-[12.5px] text-muted-foreground">
                {m.purchase_success_footer_question()}
              </p>
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="font-mono text-[12.5px] text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                {siteConfig.supportEmail}
              </a>
            </footer>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}

export default async function PurchaseSuccessPage({
  searchParams,
}: PurchaseSuccessPageProps): Promise<React.ReactElement> {
  const currentPath = await getCurrentLocalizedPath();
  const params = await searchParams;
  const token = compactParam(params.token);
  const from = compactParam(params.from);
  return (
    <PurchaseSuccessShell currentPath={currentPath}>
      <PurchaseSuccessAutoRedirect token={token} from={from} />
      <Suspense fallback={null}>
        <PurchaseDetails searchParams={searchParams} />
      </Suspense>
    </PurchaseSuccessShell>
  );
}
