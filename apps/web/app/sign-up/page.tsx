import type { Metadata } from "next";

import { PublicShell } from "@/components/public/public-shell";
import {
  buildLanguageAlternates,
  getCurrentLocalizedPath,
  getRequestLocale,
  openGraphLocaleFor,
} from "@/lib/paraglide-path";
import { workerApiUrl } from "@/lib/sign-up";
import { m } from "~/paraglide/messages";

import { FeatureList } from "./_components/feature-list";
import { SignUpForm } from "./_components/sign-up-form";

interface SignUpPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
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

export async function generateMetadata(): Promise<Metadata> {
  const currentPath = await getCurrentLocalizedPath();
  const locale = await getRequestLocale();
  return {
    title: "Criar conta",
    description: "Cadastro publico do Shadow Whisper.",
    alternates: {
      canonical: currentPath,
      languages: buildLanguageAlternates("/sign-up"),
    },
    openGraph: {
      locale: openGraphLocaleFor(locale),
      alternateLocale: locale === "en" ? ["pt_BR"] : ["en_US"],
    },
  };
}

async function fetchAffiliateEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${workerApiUrl()}/affiliate/status`, { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { enabled?: boolean };
    return data.enabled ?? false;
  } catch {
    return false;
  }
}

export default async function SignUpPage({
  searchParams,
}: SignUpPageProps): Promise<React.ReactElement> {
  const currentPath = await getCurrentLocalizedPath();
  const resolvedSearchParams = await searchParams;
  const electronQuery = pickElectronQuery(resolvedSearchParams);
  const affiliateEnabled = await fetchAffiliateEnabled();

  return (
    <PublicShell eyebrow={m.signup_eyebrow()} currentPath={currentPath}>
      <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1fr_440px] lg:py-20">
        <section className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Shadow Whisper
          </p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            {m.signup_page_title()}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">{m.signup_page_subtitle()}</p>
          <div className="mt-8">
            <FeatureList />
          </div>
        </section>

        <section aria-label={m.signup_form_aria_label()} className="w-full">
          <SignUpForm electronQuery={electronQuery} affiliateEnabled={affiliateEnabled} />
        </section>
      </div>
    </PublicShell>
  );
}
