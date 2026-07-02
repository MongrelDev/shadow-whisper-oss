import { env } from "cloudflare:workers";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { BillingAuthIntegrationLive } from "../../src/modules/billing/infra/live";
import { AffiliateRewardsLive } from "../../src/modules/affiliate/infra/live";
import { AuthLive, AuthService } from "../../src/modules/auth/server";
import {
  EmailService,
  type SendVerificationEmailInput,
} from "../../src/modules/email/application/ports/email-service";
import { findUserByEmail, setUserEmailVerified } from "../setup/db";
import { authedFetch, extractCookieHeader, readJson, workerJson } from "../setup/request";

interface AuthErrorResponse {
  message?: string;
  code?: string;
}

interface SessionResponse {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified?: boolean;
  };
  session: {
    id: string;
    userId: string;
  };
}

async function signUpEmail(input: {
  name: string;
  email: string;
  password: string;
  callbackURL?: string;
}) {
  return workerJson("/api/auth/sign-up/email", {
    method: "POST",
    json: input,
  });
}

async function signInEmail(input: { email: string; password: string }) {
  return workerJson("/api/auth/sign-in/email", {
    method: "POST",
    json: input,
  });
}

describe("email/password auth routes", () => {
  it("creates an unverified user on sign-up", async () => {
    const response = await signUpEmail({
      name: "Auth Flow",
      email: "signup-flow@example.com",
      password: "correct horse battery staple",
    });

    expect(response.ok).toBe(true);

    const createdUser = await findUserByEmail("signup-flow@example.com");

    expect(createdUser).toMatchObject({
      name: "Auth Flow",
      email: "signup-flow@example.com",
      emailVerified: false,
    });
  });

  it("uses the verified page callback in emailed links", async () => {
    const callbackURL = "http://localhost:3001/auth/verified";
    let emailed: SendVerificationEmailInput | undefined;
    const captureEmailLayer = Layer.succeed(EmailService, {
      sendVerificationEmail: (input) => {
        emailed = input;
        return Effect.void;
      },
      sendPasswordResetEmail: () => Effect.void,
    });
    const auth = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* AuthService;
      }).pipe(
        Effect.provide(
          AuthLive(env, { enableTestUtils: true }).pipe(
            Layer.provide(
              Layer.mergeAll(
                captureEmailLayer,
                BillingAuthIntegrationLive(env).pipe(Layer.provide(AffiliateRewardsLive(env)))
              )
            )
          )
        )
      )
    );

    await auth.api.signUpEmail({
      body: {
        name: "Redirect User",
        email: "redirect-user@example.com",
        password: "correct horse battery staple",
        callbackURL,
      },
    });

    expect(emailed).toBeDefined();
    expect(new URL(emailed!.verificationUrl).searchParams.get("callbackURL")).toBe(callbackURL);

    await auth.api.signUpEmail({
      body: {
        name: "Default Redirect User",
        email: "default-redirect-user@example.com",
        password: "correct horse battery staple",
      },
    });

    expect(new URL(emailed!.verificationUrl).searchParams.get("callbackURL")).toBe(callbackURL);
  });

  it("rejects sign-in while the email is still unverified", async () => {
    await signUpEmail({
      name: "Pending User",
      email: "pending-signin@example.com",
      password: "correct horse battery staple",
    });

    const response = await signInEmail({
      email: "pending-signin@example.com",
      password: "correct horse battery staple",
    });

    expect(response.ok).toBe(false);

    await expect(readJson<AuthErrorResponse>(response)).resolves.toMatchObject({
      message: expect.stringMatching(/verif|confirm|email/i),
    });
  });

  it("rejects sign-in for an unknown email without returning an internal error", async () => {
    const response = await signInEmail({
      email: "unknown-signin@example.com",
      password: "correct horse battery staple",
    });

    expect(response.status).toBe(401);
    await expect(readJson<AuthErrorResponse>(response)).resolves.toMatchObject({
      code: "INVALID_EMAIL_OR_PASSWORD",
    });
  });

  it("creates a session after sign-in once the email is verified", async () => {
    const email = "verified-signin@example.com";
    const password = "correct horse battery staple";

    await signUpEmail({
      name: "Verified User",
      email,
      password,
    });
    await setUserEmailVerified(email, true);

    const signInResponse = await signInEmail({ email, password });

    expect(signInResponse.ok).toBe(true);

    const cookie = extractCookieHeader(signInResponse);
    expect(cookie).toBeTruthy();

    const sessionResponse = await authedFetch("/api/auth/get-session", cookie as string);

    expect(sessionResponse.status).toBe(200);
    await expect(readJson<SessionResponse>(sessionResponse)).resolves.toMatchObject({
      user: {
        email,
        name: "Verified User",
      },
    });
  });
});
