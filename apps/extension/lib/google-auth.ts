import { authClient } from "./auth-client";

async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const verifier = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return { verifier, challenge };
}

async function launchGoogleOAuth(redirectUrl: string, challenge: string): Promise<string> {
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", import.meta.env.VITE_GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUrl);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("nonce", crypto.randomUUID());

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true,
  });

  if (!responseUrl) {
    const err = new Error("user_cancelled");
    err.name = "user_cancelled";
    throw err;
  }

  const code = new URL(responseUrl).searchParams.get("code");
  if (!code) throw new Error("Failed to extract authorization code from OAuth response");
  return code;
}

async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<{ idToken: string; accessToken: string }> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/extension/google/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, codeVerifier, redirectUri }),
  });

  const data = (await res.json()) as { idToken?: string; accessToken?: string; error?: string };
  if (!res.ok || !data.idToken || !data.accessToken) {
    throw new Error(data.error ?? "Token exchange failed");
  }
  return { idToken: data.idToken, accessToken: data.accessToken };
}

export async function signInWithGoogle(): Promise<void> {
  const redirectUrl = chrome.identity.getRedirectURL();
  const { verifier, challenge } = await generatePKCE();

  const code = await launchGoogleOAuth(redirectUrl, challenge);
  const { idToken, accessToken } = await exchangeCodeForTokens(code, verifier, redirectUrl);

  const result = await authClient.signIn.social({
    provider: "google",
    idToken: { token: idToken, accessToken },
  });

  if (result.error) throw new Error(result.error.message ?? "Google sign-in failed");
}
