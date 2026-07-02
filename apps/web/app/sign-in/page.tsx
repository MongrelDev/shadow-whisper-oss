import type { Metadata } from "next";

import { PublicShell } from "@/components/public/public-shell";
import {
  buildLanguageAlternates,
  getCurrentLocalizedPath,
  getRequestLocale,
  openGraphLocaleFor,
} from "@/lib/paraglide-path";
import { m } from "~/paraglide/messages";

import { SignInForm } from "./_components/sign-in-form";

export async function generateMetadata(): Promise<Metadata> {
  const currentPath = await getCurrentLocalizedPath();
  const locale = await getRequestLocale();
  return {
    title: "Entrar",
    description: "Acesse sua conta no Shadow Whisper.",
    alternates: {
      canonical: currentPath,
      languages: buildLanguageAlternates("/sign-in"),
    },
    openGraph: {
      locale: openGraphLocaleFor(locale),
      alternateLocale: locale === "en" ? ["pt_BR"] : ["en_US"],
    },
  };
}

interface SignInPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SignInPage({
  searchParams,
}: SignInPageProps): Promise<React.ReactElement> {
  const currentPath = await getCurrentLocalizedPath();
  const resolvedSearchParams = await searchParams;
  const electronQuery = pickElectronQuery(resolvedSearchParams);

  return (
    <PublicShell eyebrow={m.auth_sign_in_eyebrow()} currentPath={currentPath}>
      <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1fr_440px] lg:py-20">
        <section className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Shadow Whisper
          </p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            {m.auth_sign_in_title()}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            {m.auth_sign_in_description()}
          </p>
        </section>

        <section aria-label={m.auth_sign_in_form_aria_label()} className="w-full">
          <SignInForm electronQuery={electronQuery} />
        </section>
      </div>
    </PublicShell>
  );
}

function pickElectronQuery(
  params: Record<string, string | undefined>
): Record<string, string> | null {
  const keys = ["client_id", "state", "code_challenge", "code_challenge_method"] as const;
  const picked: Record<string, string> = {};
  for (const key of keys) {
    const value = params[key];
    if (typeof value === "string" && value.length > 0) picked[key] = value;
  }
  return picked.client_id === "electron" ? picked : null;
}
