import { test as base, chromium, type BrowserContext, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "fixtures");
const EXTENSION_DIR = path.resolve(__dirname, "../.output/chrome-mv3");
const API_ORIGIN = "http://localhost:8787";

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
  skills: Skill[];
  transcript: string;
  transformedText: string;
  transcribeStatus: number;
  skillExecuteStatus: number;
  transcribeDelayMs: number;
  requests: ApiRequest[];
};

type MockApi = {
  state: MockApiState;
  setAuthenticated: (authenticated: boolean) => void;
  setTranscript: (text: string) => void;
  setTransformedText: (text: string) => void;
  setTranscribeStatus: (status: number) => void;
  setSkillExecuteStatus: (status: number) => void;
  setTranscribeDelayMs: (delayMs: number) => void;
  getRequests: () => ApiRequest[];
  clearRequests: () => void;
};

type Fixtures = {
  context: BrowserContext;
  extensionId: string;
  page: Page;
  testPage: Page;
  mockApi: MockApi;
};

type WorkerFixtures = {
  testServerUrl: string;
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

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  return "application/octet-stream";
}

function startFixtureServer(): Promise<{ server: Server; url: string }> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");
      const pathname = requestUrl.pathname === "/" ? "/test-page.html" : requestUrl.pathname;
      const filePath = path.normalize(path.join(FIXTURES_DIR, pathname));

      if (!filePath.startsWith(FIXTURES_DIR)) {
        res.writeHead(403).end("Forbidden");
        return;
      }

      res.setHeader("content-type", contentTypeFor(filePath));
      res.setHeader("cache-control", "no-store");
      const stream = createReadStream(filePath);
      stream.on("error", () => res.writeHead(404).end("Not found"));
      stream.pipe(res);
    });

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Fixture server did not bind to a TCP port"));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

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
    "/billing/status": () => ({
      displayStatus: "free",
      plan: "free",
      usage: { totalWords: 120, limit: 2000 },
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

async function dispatchAuthenticated(
  state: MockApiState,
  ctx: RouteCtx,
  staticRoutes: Record<string, () => unknown>
): Promise<void> {
  const p = ctx.url.pathname;

  if (p === "/api/sessions/session-e2e/transcribe") {
    await handleTranscribe(state, ctx);
    return;
  }
  if (p === "/skills/preview-execute") {
    await handleSkillExecute(state, ctx, "output");
    return;
  }
  if (p === "/skills/fix-grammar/execute-sync") {
    await handleSkillExecute(state, ctx, "cleanText");
    return;
  }
  if (p === "/api/usage/daily") {
    await ctx.route.fulfill(json(handleDailyUsage(ctx.url)));
    return;
  }

  const factory = staticRoutes[p];
  await ctx.route.fulfill(json(factory ? factory() : {}));
}

async function dispatchRoute(
  state: MockApiState,
  ctx: RouteCtx,
  staticRoutes: Record<string, () => unknown>
): Promise<void> {
  const authResult = handleAuth(state, ctx);
  if (authResult) return;

  if (!state.authenticated) {
    await ctx.route.fulfill(json({ error: "unauthenticated" }, 401));
    return;
  }

  await dispatchAuthenticated(state, ctx, staticRoutes);
}

async function installApiMocks(context: BrowserContext, state: MockApiState): Promise<void> {
  const staticRoutes = buildStaticRoutes(state);
  await context.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const ctx: RouteCtx = { route, url, method: request.method() };
    state.requests.push({
      method: ctx.method,
      pathname: url.pathname,
      postData: request.postData(),
    });
    await dispatchRoute(state, ctx, staticRoutes);
  });
}

async function getExtensionServiceWorker(context: BrowserContext) {
  const serviceWorkers = context.serviceWorkers();
  return serviceWorkers[0] ?? (await context.waitForEvent("serviceworker"));
}

export async function seedExtensionStorage(
  context: BrowserContext,
  values: Record<string, unknown>
): Promise<void> {
  const worker = await getExtensionServiceWorker(context);
  await worker.evaluate((items) => chrome.storage.local.set(items), values);
}

export async function readExtensionStorage<T>(
  context: BrowserContext,
  key: string
): Promise<T | undefined> {
  const worker = await getExtensionServiceWorker(context);
  const result = await worker.evaluate((storageKey) => chrome.storage.local.get(storageKey), key);
  return (result as Record<string, T | undefined>)[key];
}

export async function readExtensionSessionStorage<T>(
  context: BrowserContext,
  key: string
): Promise<T | undefined> {
  const worker = await getExtensionServiceWorker(context);
  const result = await worker.evaluate((storageKey) => chrome.storage.session.get(storageKey), key);
  return (result as Record<string, T | undefined>)[key];
}

export async function readExtensionBadgeText(context: BrowserContext): Promise<string> {
  const worker = await getExtensionServiceWorker(context);
  return worker.evaluate(() => chrome.action.getBadgeText({}));
}

export async function hasOffscreenDocument(context: BrowserContext): Promise<boolean> {
  const worker = await getExtensionServiceWorker(context);
  return worker.evaluate(async () => {
    if (chrome.offscreen.hasDocument) return chrome.offscreen.hasDocument();
    const contexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    });
    return contexts.length > 0;
  });
}

export async function sendTranscriptToPage(
  context: BrowserContext,
  page: Page,
  text: string
): Promise<void> {
  await page.bringToFront();
  const worker = await getExtensionServiceWorker(context);
  const pageUrl = page.url();
  await worker.evaluate(
    async ({ url, transcript }) => {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find((candidate) => candidate.url === url);
      if (tab?.id === undefined) throw new Error(`No tab found for ${url}`);
      await chrome.tabs.sendMessage(tab.id, {
        target: "content",
        type: "bg:transcript-final",
        text: transcript,
        durationMs: 1200,
      });
    },
    { url: pageUrl, transcript: text }
  );
}

export async function sendTranscriptErrorToPage(
  context: BrowserContext,
  page: Page,
  code: string,
  message = "E2E transcript error"
): Promise<void> {
  await page.bringToFront();
  const worker = await getExtensionServiceWorker(context);
  const pageUrl = page.url();
  await worker.evaluate(
    async ({ url, errorCode, errorMessage }) => {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find((candidate) => candidate.url === url);
      if (tab?.id === undefined) throw new Error(`No tab found for ${url}`);
      await chrome.tabs.sendMessage(tab.id, {
        target: "content",
        type: "bg:transcript-error",
        code: errorCode,
        message: errorMessage,
      });
    },
    { url: pageUrl, errorCode: code, errorMessage: message }
  );
}

export async function triggerE2EContextMenuClick(
  context: BrowserContext,
  menuItemId: string,
  selectionText: string
): Promise<void> {
  const worker = await getExtensionServiceWorker(context);
  await worker.evaluate(
    ({ itemId, text }) => {
      const bridge = (
        globalThis as typeof globalThis & {
          __shadowWhisperE2E?: (msg: {
            target: "background:e2e";
            type: "e2e:context-menu-click";
            menuItemId: string;
            selectionText: string;
          }) => void;
        }
      ).__shadowWhisperE2E;
      if (!bridge) throw new Error("E2E bridge is not available. Build with VITE_E2E=1.");
      bridge({
        target: "background:e2e",
        type: "e2e:context-menu-click",
        menuItemId: itemId,
        selectionText: text,
      });
    },
    { itemId: menuItemId, text: selectionText }
  );
}

export async function triggerE2ERecordingToggle(context: BrowserContext): Promise<void> {
  const worker = await getExtensionServiceWorker(context);
  await worker.evaluate(() => {
    const bridge = (
      globalThis as typeof globalThis & {
        __shadowWhisperE2E?: (msg: {
          target: "background:e2e";
          type: "e2e:toggle-recording";
        }) => void;
      }
    ).__shadowWhisperE2E;
    if (!bridge) throw new Error("E2E bridge is not available. Build with VITE_E2E=1.");
    bridge({
      target: "background:e2e",
      type: "e2e:toggle-recording",
    });
  });
}

export async function openSidepanel(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  return page;
}

export const test = base.extend<Fixtures, WorkerFixtures>({
  testServerUrl: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const { server, url } = await startFixtureServer();
      try {
        await use(url);
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    },
    { scope: "worker" },
  ],

  // eslint-disable-next-line no-empty-pattern
  mockApi: async ({}, use) => {
    const state: MockApiState = {
      authenticated: true,
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
      setAuthenticated: (authenticated) => {
        state.authenticated = authenticated;
      },
      setTranscript: (text) => {
        state.transcript = text;
      },
      setTransformedText: (text) => {
        state.transformedText = text;
      },
      setTranscribeStatus: (status) => {
        state.transcribeStatus = status;
      },
      setSkillExecuteStatus: (status) => {
        state.skillExecuteStatus = status;
      },
      setTranscribeDelayMs: (delayMs) => {
        state.transcribeDelayMs = delayMs;
      },
      getRequests: () => [...state.requests],
      clearRequests: () => {
        state.requests = [];
      },
    });
  },

  context: async ({ headless, mockApi, testServerUrl }, use) => {
    if (!existsSync(EXTENSION_DIR)) {
      throw new Error(`Extension build not found at ${EXTENSION_DIR}. Run pnpm build first.`);
    }

    const userDataDir = await mkdtemp(path.join(tmpdir(), "shadow-whisper-e2e-"));
    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: "chromium",
      headless,
      viewport: { width: 1280, height: 900 },
      args: [
        `--disable-extensions-except=${EXTENSION_DIR}`,
        `--load-extension=${EXTENSION_DIR}`,
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
        "--enable-experimental-extension-apis",
      ],
    });

    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: testServerUrl,
    });
    await installApiMocks(context, mockApi.state);

    try {
      await use(context);
    } finally {
      await context.close();
      await rm(userDataDir, { recursive: true, force: true });
    }
  },

  extensionId: async ({ context }, use) => {
    const worker = await getExtensionServiceWorker(context);
    const extensionId = new URL(worker.url()).host;
    await use(extensionId);
  },

  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },

  testPage: async ({ context, testServerUrl }, use) => {
    const page = await context.newPage();
    await page.goto(`${testServerUrl}/test-page.html`);
    await expectPillHost(page);
    await use(page);
    await page.close();
  },
});

export async function expectPillHost(page: Page): Promise<void> {
  await page.locator("shadow-whisper-pill").waitFor({ state: "attached" });
}

export const expect = test.expect;
