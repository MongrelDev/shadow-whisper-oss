import type { Metadata } from "next";

import { PublicShell } from "@/components/public/public-shell";
import { getCurrentLocalizedPath } from "@/lib/paraglide-path";
import { m } from "~/paraglide/messages";

import { DesktopHandoffView } from "./_components/desktop-handoff-view";

export const metadata: Metadata = {
  title: "Returning to the app",
  robots: { index: false, follow: false },
};

export default async function DesktopHandoffPage(): Promise<React.ReactElement> {
  const currentPath = await getCurrentLocalizedPath();

  return (
    <PublicShell eyebrow={m.auth_desktop_handoff_title()} currentPath={currentPath}>
      <div className="grid flex-1 items-center py-14 lg:py-20">
        <section className="mx-auto w-full max-w-xl space-y-6">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            {m.auth_desktop_handoff_title()}
          </h1>
          <DesktopHandoffView />
        </section>
      </div>
    </PublicShell>
  );
}
