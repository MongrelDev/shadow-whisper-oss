import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { BookText, CreditCard, Home, LogOut, Settings, Sparkles } from "lucide-react";
import { AppLogo } from "~/components/app-logo";
import { UserAvatar } from "~/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Toaster } from "~/components/ui/sonner";
import { useAuth } from "~/hooks/use-auth";
import { useSignOut } from "~/hooks/use-sign-out";
import { useTranscribeStatsSync } from "~/features/progress/stats/hooks/use-transcribe-stats-sync";
import { useOnboarding } from "~/features/onboarding/hooks/use-onboarding";
import { OnboardingOverlay } from "~/features/onboarding/components/onboarding-overlay";
import { useBillingPortal } from "~/features/settings/hooks/use-billing-portal";
import { useSubscriptionStatus } from "~/features/billing/hooks/use-subscription-status";
import { cn } from "~/lib/utils";
import { m } from "~/paraglide/messages";

function ManageSubscriptionItem() {
  const { data: status } = useSubscriptionStatus();
  const { openPortal } = useBillingPortal();

  if (!status || status.displayStatus === "free") return null;

  return (
    <DropdownMenuItem onClick={openPortal} className="cursor-pointer">
      <CreditCard className="size-4" strokeWidth={1.75} />
      {m.billing_manage()}
    </DropdownMenuItem>
  );
}

function ProfileMenu({
  user,
  activePath,
  onSignOut,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  activePath: string;
  onSignOut: () => void;
}) {
  const name = user.name;
  const email = user.email;
  const image = "image" in user && typeof user.image === "string" ? user.image : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-accent/50 focus-visible:ring-offset-background"
          aria-label={m.account_menu_label()}
        >
          <UserAvatar name={name} email={email} image={image} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-64">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          {email && (
            <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">{email}</p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <MenuLink to="/" active={activePath === "/"} icon={<Home />} label={m.nav_home()} />
        <MenuLink
          to="/skills"
          active={activePath === "/skills"}
          icon={<Sparkles />}
          label={m.nav_skills()}
        />
        <MenuLink
          to="/dictionary"
          active={activePath === "/dictionary"}
          icon={<BookText />}
          label={m.nav_dictionary()}
        />
        <MenuLink
          to="/settings"
          active={activePath === "/settings"}
          icon={<Settings />}
          label={m.nav_settings()}
        />
        <ManageSubscriptionItem />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" strokeWidth={1.75} />
          {m.nav_sign_out()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuLink({
  to,
  active,
  icon,
  label,
}: {
  to: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <DropdownMenuItem asChild>
      <Link
        to={to}
        className={cn("cursor-pointer", active && "bg-accent text-accent-foreground")}
        aria-current={active ? "page" : undefined}
      >
        {icon}
        {label}
      </Link>
    </DropdownMenuItem>
  );
}

export function RootLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const { signOut } = useSignOut();
  const { completed, markCompleted } = useOnboarding();
  useTranscribeStatsSync();

  const isLoginPage = location.pathname === "/login";

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      {!isLoginPage && (
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <AppLogo className="h-7 w-7 shrink-0" />
            <span className="truncate text-sm font-bold tracking-tight">ShadowWhisper</span>
          </Link>
          {user && <ProfileMenu user={user} activePath={location.pathname} onSignOut={signOut} />}
        </header>
      )}
      <div className="flex-1 overflow-hidden p-2">
        <main className="h-full overflow-y-auto rounded-2xl border border-border bg-card shadow-sm">
          <Outlet />
        </main>
      </div>
      <Toaster richColors />
      {user && completed === false && !isLoginPage && (
        <OnboardingOverlay onComplete={markCompleted} />
      )}
    </div>
  );
}
