import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  lazyRouteComponent,
} from "@tanstack/react-router";
import { authClient } from "~/lib/auth-client";
import { RootLayout } from "./root";
import { HomePage } from "./home";
import { LoginPage } from "./login";

const rootRoute = createRootRoute({
  component: RootLayout,
  beforeLoad: async ({ location }) => {
    const { data: session } = await authClient.getSession();
    const isLoginPage = location.pathname === "/login";

    if (!session && !isLoginPage) {
      throw redirect({ to: "/login" });
    }

    if (session && isLoginPage) {
      throw redirect({ to: "/" });
    }
  },
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: lazyRouteComponent(() => import("./settings"), "SettingsPage"),
});

const dictionaryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dictionary",
  component: lazyRouteComponent(
    () => import("~/features/dictionary/pages/dictionary-page"),
    "DictionaryPage"
  ),
});

const skillsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/skills",
  component: lazyRouteComponent(
    () => import("~/features/skills/pages/skills-list-page"),
    "SkillsListPage"
  ),
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  settingsRoute,
  dictionaryRoute,
  skillsRoute,
]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
