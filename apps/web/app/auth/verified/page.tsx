import { Suspense } from "react";
import type { Metadata } from "next";

import { PublicShell } from "@/components/public/public-shell";
import { compactParam, type SearchParams } from "@/lib/search-params";
import { getCurrentLocalizedPath } from "@/lib/paraglide-path";
import { siteConfig } from "@/lib/site";
import { m } from "~/paraglide/messages";

export const metadata: Metadata = {
  title: "Email verificado",
  description: "Confirmação de email do Shadow Whisper.",
};

interface AuthVerifiedPageProps {
  searchParams: Promise<SearchParams>;
}

function VerifiedSuccess(): React.ReactElement {
  const successSteps = [
    {
      title: m.auth_verified_step_app_title(),
      description: m.auth_verified_step_app_description(),
    },
    {
      title: m.auth_verified_step_login_title(),
      description: m.auth_verified_step_login_description(),
    },
  ];

  return (
    <div className="relative grid flex-1 items-start gap-12 py-12 md:grid-cols-[1fr_400px] lg:grid-cols-[1fr_440px] lg:gap-20 lg:py-16">
      <section className="max-w-2xl">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-px w-10 bg-foreground/30" aria-hidden="true" />
          <span>{m.auth_verified_success_subtitle()}</span>
        </div>

        <h1 className="mt-7 text-[clamp(2.75rem,7vw,5rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-balance">
          {m.auth_verified_success_title_done()}
          <br />
          <span className="text-muted-foreground/70">
            {m.auth_verified_success_title_account()}
          </span>
          <br />
          {m.auth_verified_success_title_active()}
          <span className="text-primary">.</span>
        </h1>

        <p className="mt-7 max-w-[48ch] text-[15px] leading-[1.7] text-muted-foreground">
          {m.auth_verified_success_description()}
        </p>
      </section>

      <section aria-label={m.auth_verified_steps_aria()} className="w-full">
        <div className="relative isolate overflow-hidden rounded-xl border border-border/70 bg-background/75 shadow-[0_30px_80px_-60px_color-mix(in_oklch,var(--color-primary)_60%,black)] backdrop-blur-sm">
          <header className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-3.5 sm:px-6">
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-px w-6 bg-foreground/30" aria-hidden="true" />
              <span>{m.auth_verified_steps_heading()}</span>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <span className="text-foreground">{successSteps.length}</span>{" "}
              {m.auth_verified_steps_suffix()}
            </p>
          </header>

          <ol>
            {successSteps.map((step, index) => (
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
              {m.auth_verified_success_footer_question()}
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
  );
}

function VerifiedError({ error }: { error: string }): React.ReactElement {
  return (
    <div className="relative flex flex-1 items-start py-12 lg:py-16">
      <section className="max-w-2xl">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-px w-10 bg-foreground/30" aria-hidden="true" />
          <span>{m.auth_verified_error_subtitle()}</span>
        </div>

        <h1 className="mt-7 text-[clamp(2.75rem,7vw,5rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-balance">
          {m.auth_verified_error_title_link()}
          <br />
          <span className="text-muted-foreground/70">{m.auth_verified_error_title_invalid()}</span>
          <br />
          {m.auth_verified_error_title_expired()}
          <span className="text-primary">.</span>
        </h1>

        <p className="mt-7 max-w-[48ch] text-[15px] leading-[1.7] text-muted-foreground">
          {m.auth_verified_error_description()}
        </p>

        <dl className="mt-12 grid grid-cols-[5.5rem_1fr] gap-x-5 gap-y-2.5 border-t border-border/60 pt-7 text-[13px] leading-6">
          <dt className="font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {m.auth_verified_error_code_label()}
          </dt>
          <dd className="truncate font-mono text-muted-foreground">{error}</dd>
          <dt className="font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {m.auth_verified_error_validity_label()}
          </dt>
          <dd className="text-muted-foreground">{m.auth_verified_error_validity_value()}</dd>
          <dt className="font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {m.auth_verified_error_support_label()}
          </dt>
          <dd className="text-muted-foreground">{siteConfig.supportEmail}</dd>
        </dl>
      </section>
    </div>
  );
}

function VerifyingFallback(): React.ReactElement {
  return (
    <div className="relative flex flex-1 items-start py-12 lg:py-16">
      <section className="max-w-2xl">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-px w-10 bg-foreground/30" aria-hidden="true" />
          <span>{m.auth_verified_verifying_subtitle()}</span>
        </div>

        <h1 className="mt-7 text-[clamp(2.75rem,7vw,5rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-balance text-muted-foreground/70">
          {m.auth_verified_verifying_title_checking()}
          <br />
          {m.auth_verified_verifying_title_link()}
          <span className="text-primary">.</span>
        </h1>

        <p className="mt-7 max-w-[48ch] text-[15px] leading-[1.7] text-muted-foreground">
          {m.auth_verified_verifying_description()}
        </p>
      </section>
    </div>
  );
}

async function VerifiedContent({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<React.ReactElement> {
  const params = await searchParams;
  const error = compactParam(params.error);
  return error ? <VerifiedError error={error} /> : <VerifiedSuccess />;
}

function VerifiedShell({
  children,
  currentPath,
}: {
  children: React.ReactNode;
  currentPath: string;
}): React.ReactElement {
  return (
    <PublicShell eyebrow={m.auth_verified_eyebrow()} currentPath={currentPath}>
      {children}
    </PublicShell>
  );
}

export default async function AuthVerifiedPage({
  searchParams,
}: AuthVerifiedPageProps): Promise<React.ReactElement> {
  const currentPath = await getCurrentLocalizedPath();
  return (
    <VerifiedShell currentPath={currentPath}>
      <Suspense fallback={<VerifyingFallback />}>
        <VerifiedContent searchParams={searchParams} />
      </Suspense>
    </VerifiedShell>
  );
}
