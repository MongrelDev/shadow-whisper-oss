import {
  createRouter,
  createHashHistory,
  createRootRoute,
  createRoute,
  Outlet,
  Navigate,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { PillPage } from "../features/transcription/pages/pill-page";
import { AppLayout } from "../components/app-layout";
import { HomePage } from "../features/home/pages/home-page";
import { DictionaryPage } from "../features/dictionary/pages/dictionary-page";
import { SkillsListPage } from "../features/skills/pages/skills-list-page";
import { AuthShell } from "../features/auth/pages/auth-shell";
import { LoginPage } from "../features/auth/pages/login-page";
import { CheckEmailPage } from "../features/auth/pages/check-email-page";
import { PricingPage } from "../features/pricing/pages/pricing-page";
import { AffiliatePage } from "../features/affiliate/pages/affiliate-page";
import { useConfig } from "../hooks/use-config";
import { useAuthContext } from "../hooks/use-auth-context";
import { useMaintenance } from "../hooks/use-maintenance";

// Solid-background shell for all standard app windows (sidebar, pages, toasts)
function AppShellLayout(): React.ReactElement {
  useMaintenance();

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <Toaster />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: Outlet,
});

// Layout route for windows that need a solid background
const appShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app-shell",
  component: AppShellLayout,
});

function IndexPage(): React.ReactElement {
  const { config, loaded: configLoaded } = useConfig();
  const { isLoaded: authLoaded, isSignedIn } = useAuthContext();

  if (!configLoaded || !authLoaded) return <></>;
  if (!isSignedIn) return <Navigate to="/auth/login" />;
  if (!config.preferences.onboardingCompleted) {
    return <Navigate to="/app" search={{ onboarding: "welcome" }} />;
  }
  return <Navigate to="/app" />;
}

function RequireAuth(): React.ReactElement {
  const { isLoaded, isSignedIn } = useAuthContext();
  if (!isLoaded) return <></>;
  if (!isSignedIn) return <Navigate to="/auth/login" />;
  return <Outlet />;
}

function RequireGuest(): React.ReactElement {
  const { isLoaded, isSignedIn } = useAuthContext();
  if (!isLoaded) return <></>;
  if (isSignedIn) return <Navigate to="/app" />;
  return <Outlet />;
}

const indexRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/",
  component: IndexPage,
});

// App layout route - wraps all /app/* routes
const protectedRoute = createRoute({
  getParentRoute: () => appShellRoute,
  id: "protected",
  component: RequireAuth,
});

// Settings modal section search param — shared across all /app/* routes so the
// modal can overlay any page without requiring navigation.
const SETTINGS_SECTION_VALUES = [
  "account",
  "appearance",
  "languages",
  "recording",
  "shortcuts",
  "learning",
  "about",
] as const;
type SettingsSectionSearchValue = (typeof SETTINGS_SECTION_VALUES)[number];
function parseSettingsSection(value: unknown): SettingsSectionSearchValue | undefined {
  return typeof value === "string" && (SETTINGS_SECTION_VALUES as readonly string[]).includes(value)
    ? (value as SettingsSectionSearchValue)
    : undefined;
}

const appRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/app",
  component: AppLayout,
  validateSearch: (
    search: Record<string, unknown>
  ): {
    settings?: "open";
    section?: SettingsSectionSearchValue;
    confirm?: "delete-audio";
  } => ({
    settings: search.settings === "open" ? "open" : undefined,
    section: parseSettingsSection(search.section),
    confirm: search.confirm === "delete-audio" ? "delete-audio" : undefined,
  }),
});

// App index route - Home
const ONBOARDING_VALUES = ["welcome", "permissions", "shortcut", "plan", "done"] as const;
type OnboardingSearchValue = (typeof ONBOARDING_VALUES)[number];
function parseOnboarding(value: unknown): OnboardingSearchValue | undefined {
  return typeof value === "string" && (ONBOARDING_VALUES as readonly string[]).includes(value)
    ? (value as OnboardingSearchValue)
    : undefined;
}

const HOME_MODAL_VALUES = ["shortcuts", "notifications"] as const;
type HomeModalSearchValue = (typeof HOME_MODAL_VALUES)[number];
function parseHomeModal(value: unknown): HomeModalSearchValue | undefined {
  return typeof value === "string" && (HOME_MODAL_VALUES as readonly string[]).includes(value)
    ? (value as HomeModalSearchValue)
    : undefined;
}

const appIndexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  component: HomePage,
  validateSearch: (
    search: Record<string, unknown>
  ): {
    badge?: string;
    onboarding?: OnboardingSearchValue;
    modal?: HomeModalSearchValue;
  } => ({
    badge: search.badge === "open" ? "open" : undefined,
    onboarding: parseOnboarding(search.onboarding),
    modal: parseHomeModal(search.modal),
  }),
});

// Dictionary route
const dictionaryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/dictionary",
  component: DictionaryPage,
});

// Skills routes
const SKILL_BUILDER_VALUES = ["describe", "review", "done"] as const;
type SkillBuilderSearchValue = (typeof SKILL_BUILDER_VALUES)[number];
function parseSkillBuilder(value: unknown): SkillBuilderSearchValue | undefined {
  return typeof value === "string" && (SKILL_BUILDER_VALUES as readonly string[]).includes(value)
    ? (value as SkillBuilderSearchValue)
    : undefined;
}

type SkillsTab = "mine" | "official";
function parseSkillsTab(value: unknown): SkillsTab {
  return value === "mine" ? "mine" : "official";
}

const skillsListRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/skills",
  component: SkillsListPage,
  validateSearch: (
    search: Record<string, unknown>
  ): {
    builder?: SkillBuilderSearchValue;
    skill?: string;
    tab?: SkillsTab;
    editSkill?: string;
  } => ({
    builder: parseSkillBuilder(search.builder),
    skill: typeof search.skill === "string" && search.skill.length > 0 ? search.skill : undefined,
    tab: parseSkillsTab(search.tab),
    editSkill:
      typeof search.editSkill === "string" && search.editSkill.length > 0
        ? search.editSkill
        : undefined,
  }),
});

// /app/settings is now a redirect — settings live as a global modal mounted in
// AppLayout, controlled by the `settings` search param on appRoute. Kept for
// backward compatibility with old links/bookmarks.
const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings",
  component: () => <Navigate to="/app" search={{ settings: "open" }} />,
});

const pricingRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/pricing",
  component: PricingPage,
});

const affiliateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/affiliate",
  component: AffiliatePage,
});

// Auth route
const guestRoute = createRoute({
  getParentRoute: () => appShellRoute,
  id: "guest",
  component: RequireGuest,
});

const authRoute = createRoute({
  getParentRoute: () => guestRoute,
  path: "/auth",
  component: AuthShell,
});

const authIndexRoute = createRoute({
  getParentRoute: () => authRoute,
  path: "/",
  component: () => <Navigate to="/auth/login" />,
});

const loginRoute = createRoute({
  getParentRoute: () => authRoute,
  path: "/login",
  component: LoginPage,
  validateSearch: (
    search: Record<string, unknown>
  ): { email?: string; verified?: "pending" | "success" } => ({
    email: typeof search.email === "string" ? search.email : undefined,
    verified:
      search.verified === "pending" || search.verified === "success" ? search.verified : undefined,
  }),
});

const signupRoute = createRoute({
  getParentRoute: () => authRoute,
  path: "/signup",
  component: () => <Navigate to="/auth/login" />,
});

const checkEmailRoute = createRoute({
  getParentRoute: () => authRoute,
  path: "/check-email",
  component: CheckEmailPage,
  validateSearch: (search: Record<string, unknown>): { email?: string } => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
});

type PillView = "minimized" | "recording";

function PillRouteGuard(): React.ReactElement {
  const { isLoaded, isSignedIn } = useAuthContext();
  if (!isLoaded) return <></>;
  if (!isSignedIn) return <></>;
  return <PillPage />;
}

const pillRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pill",
  component: PillRouteGuard,
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput): { view: PillView } => ({
    view: search.view === "recording" ? "recording" : "minimized",
  }),
});

// Build route tree
const routeTree = rootRoute.addChildren([
  appShellRoute.addChildren([
    indexRoute,
    protectedRoute.addChildren([
      appRoute.addChildren([
        appIndexRoute,
        dictionaryRoute,
        skillsListRoute,
        settingsRoute,
        pricingRoute,
        affiliateRoute,
      ]),
    ]),
    guestRoute.addChildren([
      authRoute.addChildren([authIndexRoute, loginRoute, signupRoute, checkEmailRoute]),
    ]),
  ]),
  pillRoute,
]);

// Create router with hash history for Electron
export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  defaultPreload: "intent",
});

// Type registration for type-safe navigation
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
