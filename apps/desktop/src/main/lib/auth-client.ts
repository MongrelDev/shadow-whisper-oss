import { createAuthClient } from "better-auth/client";
import { stripeClient } from "@better-auth/stripe/client";
import { electronClient } from "@better-auth/electron/client";
import { storage } from "@better-auth/electron/storage";
import { getToken, setToken } from "./token-storage";

type AuthClientOptions = NonNullable<Parameters<typeof createAuthClient>[0]>;
type AuthClientPlugin = NonNullable<AuthClientOptions["plugins"]>[number];

const WORKER_URL = __WORKER_URL__;
const WEB_URL = __WEB_URL__;

if (!WORKER_URL || !WEB_URL) {
  throw new Error("VITE_WORKER_URL and VITE_WEB_URL must be set for desktop auth client");
}

function extractToken(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("token" in data)) return null;
  const token = (data as { token?: unknown }).token;
  return typeof token === "string" && token.length > 0 ? token : null;
}

function readElectronSessionToken(ctx: {
  request?: { url?: unknown };
  data?: unknown;
}): string | null {
  return String(ctx.request?.url ?? "").includes("/electron/token") ? extractToken(ctx.data) : null;
}

// pnpm resolves @better-fetch/fetch through multiple plugin paths here; the
// runtime plugin shape is compatible, but TypeScript sees different duplex types.
const desktopElectronClient = electronClient({
  signInURL: `${WEB_URL}/sign-in`,
  protocol: { scheme: "com.shadowwhisper.app" },
  storage: storage(),
}) as unknown as AuthClientPlugin;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- stripe plugin return type references a non-portable path
export const authClient: any = createAuthClient({
  baseURL: WORKER_URL,
  fetchOptions: {
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get("set-auth-token") ?? readElectronSessionToken(ctx);
      if (token) setToken(token);
    },
    auth: {
      type: "Bearer",
      token: () => getToken() ?? undefined,
    },
  },
  plugins: [stripeClient({ subscription: true }), desktopElectronClient],
});
