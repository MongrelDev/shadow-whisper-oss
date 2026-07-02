import { createContext, useEffect, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchSessionUser, type SessionUser } from "../lib/auth-session";
import type { AuthSessionUser } from "../../shared/ipc-types";
import { m } from "~/paraglide/messages";

const WEB_URL = import.meta.env.VITE_WEB_URL;

class AuthActionError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "AuthActionError";
    this.code = code;
  }
}

function buildEmailVerificationCallbackUrl(): string {
  if (!WEB_URL || WEB_URL === "undefined") {
    throw new Error(m.auth_env_web_url_missing());
  }
  return new URL("/auth/verified", WEB_URL).toString();
}

export interface AuthContextValue {
  user: SessionUser | null;
  userId: string | null;
  isSignedIn: boolean;
  isLoaded: boolean;
  sendVerificationEmail: (email: string) => Promise<void>;
  checkEmailStatus: (email: string) => Promise<boolean>;
  refreshSession: () => Promise<SessionUser | null>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function isBridgeUserShape(value: unknown): value is {
  id: string;
  email: string;
  name: string;
  emailVerified?: unknown;
  image?: unknown;
} {
  if (!value || typeof value !== "object") return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === "string" && typeof user.email === "string" && typeof user.name === "string"
  );
}

function normalizeBridgeUser(raw: unknown): AuthSessionUser | null {
  if (!isBridgeUserShape(raw)) return null;
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    emailVerified: Boolean(raw.emailVerified),
    image: typeof raw.image === "string" ? raw.image : null,
  };
}

function extractStringField(path: object, key: "href" | "url"): string | null {
  if (!(key in path)) return null;
  const value = (path as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function extractObjectField(path: unknown): string | null {
  if (!path || typeof path !== "object") return null;
  return extractStringField(path, "href") ?? extractStringField(path, "url");
}

function safeStringify(path: unknown): string {
  try {
    return JSON.stringify(path);
  } catch {
    return String(path ?? "");
  }
}

function serializeAuthPath(path: unknown): string {
  if (typeof path === "string") return path;
  const fromObject = extractObjectField(path);
  if (fromObject) return fromObject;
  return safeStringify(path);
}

function handleAuthenticated(queryClient: QueryClient, user: unknown): void {
  console.info("[auth] onAuthenticated", user);
  const normalized = normalizeBridgeUser(user);
  if (normalized) {
    queryClient.setQueryData<SessionUser | null>(["auth", "session"], normalized);
  }
  queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
}

function handleUserUpdated(queryClient: QueryClient, user: unknown): void {
  console.info("[auth] onUserUpdated", user);
  const normalized = normalizeBridgeUser(user);
  if (normalized) {
    queryClient.setQueryData<SessionUser | null>(["auth", "session"], normalized);
  }
  queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
}

function handlePurchaseDeepLink(
  queryClient: QueryClient,
  payload: { from: "onboarding" | "billing" | "unknown"; token: string | null }
): void {
  console.info("[auth] purchase deep link", payload);
  queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
  queryClient.invalidateQueries({ queryKey: ["user", "subscriptionStatus"] });
  if (payload.from === "billing") toast.success(m.billing_plan_updated());
}

async function performSendVerificationEmail(
  mutateAsync: (args: { email: string }) => Promise<unknown>,
  email: string
): Promise<void> {
  try {
    await mutateAsync({ email });
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(m.er_internal());
  }
}

async function performCheckEmailStatus(email: string): Promise<boolean> {
  const result = await window.api.auth.checkEmailStatus(email);
  if (result.error) throw new AuthActionError(result.error.message, result.error.code);
  return result.verified;
}

function computeDerivedAuth(
  sessionData: SessionUser | null | undefined,
  isFetched: boolean
): {
  user: SessionUser | null;
  userId: string | null;
  isLoaded: boolean;
  isSignedIn: boolean;
} {
  const user = sessionData ?? null;
  return {
    user,
    userId: user?.id ?? null,
    isLoaded: isFetched,
    isSignedIn: user !== null,
  };
}

function useSendVerificationEmailMutation() {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const result = await window.api.auth.sendVerificationEmail({
        email,
        callbackURL: buildEmailVerificationCallbackUrl(),
      });
      if (!result.ok) throw new AuthActionError(result.error.message, result.error.code);
    },
  });
}

function useSignOutMutation(queryClient: QueryClient) {
  return useMutation({
    mutationFn: async () => {
      const result = await window.api.auth.signOut();
      if (!result.ok) throw new AuthActionError(result.error.message, result.error.code);
    },
    onSuccess: () => {
      queryClient.setQueryData<SessionUser | null>(["auth", "session"], null);
    },
  });
}

function useAuthBridgeListeners(queryClient: QueryClient): void {
  useEffect(() => {
    const unsubscribeAuthenticated = window.onAuthenticated?.((user) => {
      handleAuthenticated(queryClient, user);
      window.api.auth.relayAuthToPill();
    });
    const unsubscribeUserUpdated = window.onUserUpdated?.((user) =>
      handleUserUpdated(queryClient, user)
    );
    const unsubscribeAuthError = window.onAuthError?.((ctx) => {
      console.error("[auth] onAuthError", {
        ...ctx,
        path: serializeAuthPath(ctx?.path),
      });
    });
    const unsubscribeAuthDebug = window.api.auth.onDebug((payload) => {
      console.info("[auth] debug", payload);
    });
    const unsubscribePurchaseDeepLink = window.api.auth.onPurchaseDeepLink((payload) =>
      handlePurchaseDeepLink(queryClient, payload)
    );
    const unsubscribeSessionChanged = window.api.auth.onSessionChanged(() => {
      void queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    });
    return () => {
      unsubscribeAuthenticated?.();
      unsubscribeUserUpdated?.();
      unsubscribeAuthError?.();
      unsubscribeAuthDebug?.();
      unsubscribePurchaseDeepLink?.();
      unsubscribeSessionChanged();
    };
  }, [queryClient]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ["auth", "session"],
    queryFn: fetchSessionUser,
    staleTime: 60_000,
    retry: false,
  });

  useAuthBridgeListeners(queryClient);

  const sendVerificationEmailMutation = useSendVerificationEmailMutation();
  const signOutMutation = useSignOutMutation(queryClient);

  const sendVerificationEmail = (email: string) =>
    performSendVerificationEmail(sendVerificationEmailMutation.mutateAsync, email);

  const checkEmailStatus = performCheckEmailStatus;

  const refreshSession = async () => {
    const user = await fetchSessionUser();
    queryClient.setQueryData(["auth", "session"], user);
    return user;
  };

  const signOut = async () => {
    await signOutMutation.mutateAsync();
  };

  const { user, userId, isLoaded, isSignedIn } = computeDerivedAuth(
    sessionQuery.data,
    sessionQuery.isFetched
  );

  return (
    <AuthContext
      value={{
        user,
        userId,
        isSignedIn,
        isLoaded,
        sendVerificationEmail,
        checkEmailStatus,
        refreshSession,
        signOut,
      }}
    >
      {children}
    </AuthContext>
  );
}
