import {
  test as base,
  _electron as electron,
  type ElectronApplication,
  type Page,
} from "@playwright/test";
import { existsSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ENTRY = path.resolve(__dirname, "../out/main/index.js");
const API_ORIGIN = process.env.API_BASE_URL ?? "http://localhost:8787";

type Skill = {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  source: "official" | "custom";
  isInstalled: boolean;
};

type ApiRequest = {
  method: string;
  pathname: string;
  postData: string | null;
};

type MockApiState = {
  authenticated: boolean;
  subscriptionPlan: "free" | "pro";
  skills: Skill[];
  transcript: string;
  transformedText: string;
  transcribeStatus: number;
  skillExecuteStatus: number;
  transcribeDelayMs: number;
  requests: ApiRequest[];
};

export type MockApi = {
  state: MockApiState;
  setAuthenticated: (authenticated: boolean) => void;
  setSubscriptionPlan: (plan: "free" | "pro") => void;
  setTranscript: (text: string) => void;
  setTransformedText: (text: string) => void;
  setTranscribeStatus: (status: number) => void;
  setSkillExecuteStatus: (status: number) => void;
  setTranscribeDelayMs: (delayMs: number) => void;
  getRequests: () => ApiRequest[];
  clearRequests: () => void;
};

type Fixtures = {
  electronApp: ElectronApplication;
  mainWindow: Page;
  mockApi: MockApi;
  userDataDir: string;
};

const DEFAULT_SKILLS: Skill[] = [
  {
    id: "fix-grammar",
    slug: "fix-grammar",
    displayName: "Corrigir gramática",
    description: "Corrige erros gramaticais.",
    source: "official",
    isInstalled: true,
  },
  {
    id: "cleanup",
    slug: "cleanup",
    displayName: "Polir texto",
    description: "Melhora clareza e tom.",
    source: "official",
    isInstalled: false,
  },
];

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return {
    status,
    contentType: "application/json",
    headers,
    body: JSON.stringify(body),
  };
}

function makeStats() {
  return {
    currentStreak: 2,
    weeklyAvgWpm: 118,
    totalWords: 4200,
    isFirstWeek: false,
    hasAnyEntries: true,
    achievements: [],
    milestones: [],
  };
}

function makeShareCardStats() {
  return {
    totalWords: 124_000,
    totalDuration: 7_440_000,
    totalTranscriptions: 342,
    weeklyAvgWpm: 87,
    currentStreak: 7,
    maxStreak: 14,
    memberSince: new Date("2025-05-24T12:00:00Z").getTime(),
    personalBestWpm: 132,
    distinctSkillsAllTime: 4,
    distinctLanguagesAllTime: 2,
    achievements: [],
    milestones: [],
  };
}

type RouteCtx = { route: import("@playwright/test").Route; url: URL; method: string };

function handleAuth(state: MockApiState, { route, url }: RouteCtx) {
  if (url.pathname.includes("/auth/get-session")) {
    if (!state.authenticated) return route.fulfill(json(null));
    return route.fulfill(
      json({
        session: {
          id: "session-e2e",
          userId: "user-e2e",
          expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        },
        user: { id: "user-e2e", name: "E2E User", email: "e2e@example.com" },
      })
    );
  }
  if (url.pathname.includes("/auth/sign-in/email")) {
    state.authenticated = true;
    return route.fulfill(
      json(
        {
          user: { id: "user-e2e", name: "E2E User", email: "e2e@example.com" },
          token: "token-e2e",
        },
        200,
        { "set-auth-token": "token-e2e" }
      )
    );
  }
  if (url.pathname.includes("/auth/sign-up/email")) {
    return route.fulfill(json({ user: { id: "user-e2e", email: "e2e@example.com" } }));
  }
  return null;
}

async function handleTranscribe(state: MockApiState, { route }: RouteCtx) {
  if (state.transcribeDelayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, state.transcribeDelayMs));
  }
  if (state.transcribeStatus !== 200) {
    return route.fulfill(json({ error: "transcribe_failed" }, state.transcribeStatus));
  }
  return route.fulfill(
    json({
      rawText: state.transcript,
      improvedText: state.transcript,
      durationMs: 1200,
      stats: {
        todayWordCount: 12,
        weekWordCount: 120,
        currentStreak: 2,
        wpm: 118,
        totalWords: 4200,
        weeklyAvgWpm: 118,
        isFirstWeek: false,
      },
    })
  );
}

function handleSkillExecute(state: MockApiState, { route }: RouteCtx, field: string) {
  if (state.skillExecuteStatus !== 200) {
    return route.fulfill(json({ error: "skill_execute_failed" }, state.skillExecuteStatus));
  }
  return route.fulfill(json({ [field]: state.transformedText }));
}

function buildStaticRoutes(state: MockApiState): Record<string, () => unknown> {
  return {
    "/api/sessions/warmup": () => ({ sessionId: "session-e2e" }),
    "/api/usage/stats": () => makeStats(),
    "/api/usage/share-card": () => makeShareCardStats(),
    "/billing/status": () => ({
      displayStatus: state.subscriptionPlan,
      plan: state.subscriptionPlan,
      usage: { totalWords: 120, limit: state.subscriptionPlan === "pro" ? 999_999 : 2000 },
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      trialEnd: null,
    }),
    "/billing/plans": () => [
      {
        name: "pro",
        monthly: { priceId: "price_monthly_e2e", amountInCents: 1200 },
        annual: { priceId: "price_annual_e2e", amountInCents: 9600 },
      },
    ],
    "/skills": () => ({ skills: state.skills }),
    "/dictionary": () => ({ words: [], snippets: [] }),
  };
}

function handleDailyUsage(url: URL) {
  const from = url.searchParams.get("from") ?? "2026-01-01";
  const to = url.searchParams.get("to") ?? from;
  return {
    from,
    to,
    items: [{ date: to, wordCount: 120, entries: 2, apps: [] }],
    achievementDates: [],
  };
}

type DynamicMatcher = {
  test: (pathname: string, method: string) => boolean;
  handle: (state: MockApiState, ctx: RouteCtx) => Promise<void>;
};

function buildDynamicRoutes(): DynamicMatcher[] {
  return [
    {
      test: (p) => /^\/api\/sessions\/[^/]+\/transcribe$/.test(p),
      handle: (state, ctx) => handleTranscribe(state, ctx),
    },
    {
      test: (p) => p === "/skills/preview-execute",
      handle: (state, ctx) => handleSkillExecute(state, ctx, "output"),
    },
    {
      test: (p) => /^\/skills\/[^/]+\/execute-sync$/.test(p),
      handle: (state, ctx) => handleSkillExecute(state, ctx, "cleanText"),
    },
    {
      test: (p) => p === "/api/usage/daily",
      handle: (_s, ctx) => ctx.route.fulfill(json(handleDailyUsage(ctx.url))),
    },
    {
      test: (p, m) => p.startsWith("/dictionary") && (m === "POST" || m === "DELETE"),
      handle: (_s, ctx) => ctx.route.fulfill(json({ success: true })),
    },
    {
      test: (p) => p.startsWith("/affiliate"),
      handle: (_s, ctx) =>
        ctx.route.fulfill(
          json({ referralCode: "ref-e2e", totalReferrals: 3, conversions: 1, earnings: 0 })
        ),
    },
    {
      test: (p) => p === "/auth/subscription-portal",
      handle: (_s, ctx) =>
        ctx.route.fulfill(json({ url: "https://billing.stripe.com/mock-portal" })),
    },
  ];
}

async function dispatchAuthenticated(
  state: MockApiState,
  ctx: RouteCtx,
  staticRoutes: Record<string, () => unknown>,
  dynamicRoutes: DynamicMatcher[]
): Promise<void> {
  const match = dynamicRoutes.find((r) => r.test(ctx.url.pathname, ctx.method));
  if (match) {
    await match.handle(state, ctx);
    return;
  }
  const factory = staticRoutes[ctx.url.pathname];
  await ctx.route.fulfill(json(factory ? factory() : {}));
}

async function dispatchRoute(
  state: MockApiState,
  ctx: RouteCtx,
  staticRoutes: Record<string, () => unknown>,
  dynamicRoutes: DynamicMatcher[]
): Promise<void> {
  const authResult = handleAuth(state, ctx);
  if (authResult) return;
  if (!state.authenticated) {
    await ctx.route.fulfill(json({ error: "unauthenticated" }, 401));
    return;
  }
  await dispatchAuthenticated(state, ctx, staticRoutes, dynamicRoutes);
}

async function installApiMocks(page: Page, state: MockApiState): Promise<void> {
  const staticRoutes = buildStaticRoutes(state);
  const dynamicRoutes = buildDynamicRoutes();
  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const ctx: RouteCtx = { route, url, method: request.method() };
    state.requests.push({
      method: ctx.method,
      pathname: url.pathname,
      postData: request.postData(),
    });
    await dispatchRoute(state, ctx, staticRoutes, dynamicRoutes);
  });
}

export function seedConfigFile(userDataDir: string, patch: Record<string, unknown>): void {
  const defaults = {
    shortcuts: {
      transcription: "CommandOrControl+Alt+W",
      pasteLastTranscript: "CommandOrControl+Alt+V",
      cancelRecording: "Escape",
    },
    preferences: {
      theme: "system",
      locale: "en",
      selectedLanguages: ["en"],
      launchAtLogin: false,
      notifications: true,
      onboardingCompleted: false,
      seenTourSteps: [],
      privacyMode: false,
      useCases: [],
      audio: {
        enableSounds: true,
        shouldMuteAudio: false,
        soundFolder: false,
        inputDeviceId: false,
        outputDeviceId: false,
        localAudioRetention: false,
      },
    },
    ui: { sidebarCollapsed: false },
    skills: { shortcuts: {} },
    autoTeachEnabled: true,
  };

  const config = deepMerge(defaults, patch);
  writeFileSync(path.join(userDataDir, "app-config.json"), JSON.stringify(config), "utf-8");
}

export function seedAuthToken(userDataDir: string, token = "token-e2e"): void {
  writeFileSync(path.join(userDataDir, "auth-token.dat"), token, "utf-8");
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    result[key] = isPlainObject(sv) && isPlainObject(target[key]) ? deepMerge(target[key], sv) : sv;
  }
  return result;
}

export { API_ORIGIN };

export type StandaloneApp = {
  app: ElectronApplication;
  mainWindow: Page;
  cleanup: () => Promise<void>;
};

async function waitForMainWindow(app: ElectronApplication): Promise<Page> {
  const timeoutAt = Date.now() + 5_000;

  while (Date.now() < timeoutAt) {
    const window = app
      .windows()
      .find((page) => page.url() !== "about:blank" && !page.url().includes("/pill"));
    if (window) {
      await window.waitForLoadState("domcontentloaded");
      return window;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error("Desktop main window was not created within 5 seconds.");
}

export async function launchStandaloneApp(
  configPatch: Record<string, unknown>,
  opts: { seedToken?: boolean } = {}
): Promise<StandaloneApp> {
  const userDataDir = await mkdtemp(path.join(tmpdir(), "sw-standalone-e2e-"));
  seedConfigFile(userDataDir, configPatch);
  if (opts.seedToken !== false) {
    seedAuthToken(userDataDir);
  }

  const app = await electron.launch({
    args: [APP_ENTRY],
    env: { ...process.env, NODE_ENV: "test", ELECTRON_USER_DATA_DIR: userDataDir },
  });

  const mainWindow = await waitForMainWindow(app);

  return {
    app,
    mainWindow,
    cleanup: async () => {
      await app.close();
      await rm(userDataDir, { recursive: true, force: true });
    },
  };
}

export function mockSessionRoute(authenticated: boolean) {
  return (route: import("@playwright/test").Route): void => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/auth/get-session")) {
      if (!authenticated) {
        route.fulfill({ status: 200, contentType: "application/json", body: "null" });
        return;
      }
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          session: {
            id: "s-e2e",
            userId: "u-e2e",
            expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
          },
          user: { id: "u-e2e", name: "E2E User", email: "e2e@example.com" },
        }),
      });
      return;
    }
    if (url.pathname.includes("/auth/sign-in/email")) {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "set-auth-token": "token-e2e" },
        body: JSON.stringify({
          user: { id: "u-e2e", email: "e2e@example.com", name: "E2E User" },
          token: "token-e2e",
        }),
      });
      return;
    }
    if (url.pathname.includes("/auth/sign-up/email")) {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: { id: "u-e2e", email: "e2e@example.com" } }),
      });
      return;
    }
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  };
}

export async function getPillWindow(app: ElectronApplication): Promise<Page> {
  const pillPromise = new Promise<Page>((resolve) => {
    app.on("window", (page) => {
      if (page.url().includes("pill")) resolve(page);
    });
  });
  const existing = app.windows().find((w) => w.url().includes("pill"));
  if (existing) return existing;
  return pillPromise;
}

export async function emitIPC(
  app: ElectronApplication,
  channel: string,
  ...args: unknown[]
): Promise<void> {
  await app.evaluate(
    (_electron, { channel, args }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BrowserWindow } = require("electron");
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
          win.webContents.send(channel, ...args);
        }
      }
    },
    { channel, args }
  );
}

export const test = base.extend<Fixtures>({
  mockApi: async (_deps, use) => {
    const state: MockApiState = {
      authenticated: true,
      subscriptionPlan: "free",
      skills: DEFAULT_SKILLS,
      transcript: "texto transcrito",
      transformedText: "texto com erro corrigido",
      transcribeStatus: 200,
      skillExecuteStatus: 200,
      transcribeDelayMs: 0,
      requests: [],
    };
    await use({
      state,
      setAuthenticated: (v) => {
        state.authenticated = v;
      },
      setSubscriptionPlan: (v) => {
        state.subscriptionPlan = v;
      },
      setTranscript: (v) => {
        state.transcript = v;
      },
      setTransformedText: (v) => {
        state.transformedText = v;
      },
      setTranscribeStatus: (v) => {
        state.transcribeStatus = v;
      },
      setSkillExecuteStatus: (v) => {
        state.skillExecuteStatus = v;
      },
      setTranscribeDelayMs: (v) => {
        state.transcribeDelayMs = v;
      },
      getRequests: () => [...state.requests],
      clearRequests: () => {
        state.requests = [];
      },
    });
  },

  userDataDir: async (_deps, use) => {
    const dir = await mkdtemp(path.join(tmpdir(), "sw-desktop-e2e-"));
    await use(dir);
    await rm(dir, { recursive: true, force: true });
  },

  electronApp: async ({ mockApi, userDataDir }, use) => {
    if (!existsSync(APP_ENTRY)) {
      throw new Error(`Desktop build not found at ${APP_ENTRY}. Run "pnpm build" first.`);
    }

    seedConfigFile(userDataDir, { preferences: { onboardingCompleted: true } });
    seedAuthToken(userDataDir);

    const app = await electron.launch({
      args: [APP_ENTRY],
      env: {
        ...process.env,
        NODE_ENV: "test",
        ELECTRON_USER_DATA_DIR: userDataDir,
      },
    });

    const mainWindow = await waitForMainWindow(app);
    await installApiMocks(mainWindow, mockApi.state);

    await use(app);
    await app.close();
  },

  mainWindow: async ({ electronApp }, use) => {
    const window = await waitForMainWindow(electronApp);
    await use(window);
  },
});

export const expect = test.expect;
