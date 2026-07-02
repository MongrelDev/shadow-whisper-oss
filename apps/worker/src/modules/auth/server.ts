import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { bearer, testUtils } from "better-auth/plugins";
import { electron } from "@better-auth/electron";
import { Context, Effect, Layer } from "effect";
import { isDisposableEmail } from "./disposable-email";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@whisper/db/schema";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./password-policy";
import { BillingAuthIntegration } from "../billing/application/ports/billing-auth-integration";
import { EmailService, type EmailServiceContract } from "../email/application/ports/email-service";
import { resolveLocaleFromRequest } from "../email/domain/email-locale";

function resolveCookieDomain(env: Env): string {
  try {
    const hostname = new URL(env.APP_URL).hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") return "localhost";
    const parts = hostname.split(".");
    if (parts.length >= 2) return `.${parts.slice(-2).join(".")}`;
    return hostname;
  } catch {
    return "localhost";
  }
}

function getBaseUrl(request: Request): string {
  const requestUrl = new URL(request.url);
  return `${requestUrl.protocol}//${requestUrl.host}`;
}

function withDefaultEmailVerificationCallback(url: string, appUrl: string): string {
  const verificationUrl = new URL(url);
  if (verificationUrl.searchParams.get("callbackURL") === "/") {
    verificationUrl.searchParams.set("callbackURL", new URL("/auth/verified", appUrl).toString());
  }
  return verificationUrl.toString();
}

interface AuthSession {
  user?: {
    id?: string;
  } | null;
}

interface AuthSignupResult {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface AuthApi {
  getSession(input: { headers: Headers }): Promise<AuthSession | null>;
  signUpEmail(input: {
    body: {
      name: string;
      email: string;
      password: string;
      callbackURL?: string;
    };
  }): Promise<AuthSignupResult>;
}

interface AuthInstance {
  api: AuthApi;
  handler(request: Request): Response | Promise<Response>;
  $context: Promise<unknown>;
}

export class AuthService extends Context.Service<AuthService, AuthInstance>()("AuthService") {}

interface BuildAuthOptions {
  readonly emailService: EmailServiceContract;
  readonly billingAuthIntegration: Effect.Success<typeof BillingAuthIntegration>;
  readonly enableTestUtils?: boolean;
  readonly waitUntil?: (promise: Promise<unknown>) => void;
}

export interface AuthLiveOptions {
  readonly enableTestUtils?: boolean;
  readonly waitUntil?: (promise: Promise<unknown>) => void;
}

function buildTrustedOrigins(env: Env): string[] {
  return [
    env.APP_URL,
    "com.shadowwhisper.app:/",
    ...(env.EXTENSION_ID
      ? [`chrome-extension://${env.EXTENSION_ID}`]
      : env.ENVIRONMENT === "development"
        ? ["chrome-extension://*"]
        : []),
    ...(env.TRUSTED_ORIGINS?.split(",") ?? []),
  ];
}

function buildAdvancedConfig(env: Env, options: BuildAuthOptions): Record<string, unknown> {
  const config: Record<string, unknown> = {
    crossSubDomainCookies: {
      enabled: true,
      domain: resolveCookieDomain(env),
    },
  };
  if (options.waitUntil) {
    config.backgroundTasks = { waitUntil: options.waitUntil };
  }
  return config;
}

function buildAuth(env: Env, options: BuildAuthOptions): AuthInstance {
  const db = drizzle(env.DB, { schema });
  const emailService = options.emailService;

  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    baseURL: env.APP_URL,
    basePath: "/api/auth",
    secret: env.AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }, request) => {
        await Effect.runPromise(
          emailService.sendPasswordResetEmail({
            appBaseUrl: getBaseUrl(request ?? new Request(env.APP_URL)),
            locale: resolveLocaleFromRequest(request),
            name: user.name,
            resetUrl: url,
            to: user.email,
          })
        );
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      expiresIn: 60 * 60 * 24,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }, request) => {
        await Effect.runPromise(
          emailService.sendVerificationEmail({
            appBaseUrl: getBaseUrl(request ?? new Request(env.APP_URL)),
            locale: resolveLocaleFromRequest(request),
            name: user.name,
            to: user.email,
            verificationUrl: withDefaultEmailVerificationCallback(url, env.APP_URL),
          })
        );
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 45,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    trustedOrigins: buildTrustedOrigins(env),
    advanced: buildAdvancedConfig(env, options),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        prompt: "select_account",
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (isDisposableEmail(user.email)) {
              throw APIError.from("FORBIDDEN", {
                code: "DISPOSABLE_EMAIL",
                message: "Disposable email addresses are not allowed",
              });
            }
          },
        },
      },
    },
    plugins: [
      bearer(),
      electron({ disableOriginOverride: true }),
      ...(options.enableTestUtils ? [testUtils()] : [options.billingAuthIntegration.stripePlugin]),
    ],
  });
}

export const AuthLive = (env: Env, options: AuthLiveOptions = {}) =>
  Layer.effect(
    AuthService,
    Effect.gen(function* () {
      const emailService = yield* EmailService;
      const billingAuthIntegration = yield* BillingAuthIntegration;
      return buildAuth(env, {
        emailService,
        billingAuthIntegration,
        enableTestUtils: options.enableTestUtils,
        waitUntil: options.waitUntil,
      });
    })
  );
