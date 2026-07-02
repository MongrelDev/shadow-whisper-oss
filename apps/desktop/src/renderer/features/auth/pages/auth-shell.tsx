import { Outlet } from "@tanstack/react-router";
import { AppLogo } from "@/components/app-logo";
import { m } from "~/paraglide/messages";

export function AuthShell(): React.ReactElement {
  return (
    <div className="relative h-screen overflow-y-auto bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(42rem_24rem_at_50%_0%,color-mix(in_oklch,var(--color-primary)_8%,transparent),transparent)]"
      />

      <main className="relative flex min-h-full items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex h-10 justify-center">
            <AppLogo className="h-10 w-10" />
          </div>

          <Outlet />

          <VersionBadge />
        </div>
      </main>
    </div>
  );
}

function VersionBadge(): React.ReactElement {
  return (
    <div className="mt-12 text-center text-xs text-muted-foreground tabular-nums">
      {m.settings_about_version_sublabel()}
    </div>
  );
}
