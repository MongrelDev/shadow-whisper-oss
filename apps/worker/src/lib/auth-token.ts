export interface SessionTokenPayload {
  readonly sid?: string;
  readonly uid?: string;
  readonly purpose?: string;
  readonly exp: number;
}

export type VerifyResult =
  | { readonly ok: true; readonly payload: SessionTokenPayload }
  | {
      readonly ok: false;
      readonly reason: "invalid_format" | "bad_signature" | "expired" | "malformed_payload";
    };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function importHmacKey(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

export async function signSessionToken(
  payload: SessionTokenPayload,
  secret: string
): Promise<string> {
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(encoder.encode(payloadJson));
  const key = await importHmacKey(secret, "sign");
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const sigB64 = base64UrlEncode(new Uint8Array(sig));
  return `${payloadB64}.${sigB64}`;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isValidPayload(value: unknown): value is SessionTokenPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    isOptionalString(v.sid) &&
    isOptionalString(v.uid) &&
    isOptionalString(v.purpose) &&
    typeof v.exp === "number"
  );
}

function splitToken(token: string): { payloadB64: string; sigB64: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const payloadB64 = parts[0]!;
  const sigB64 = parts[1]!;
  if (payloadB64.length === 0 || sigB64.length === 0) return null;
  return { payloadB64, sigB64 };
}

function decodeSegments(
  payloadB64: string,
  sigB64: string
): { payloadBytes: Uint8Array; sigBytes: Uint8Array } | null {
  try {
    return {
      payloadBytes: base64UrlDecode(payloadB64),
      sigBytes: base64UrlDecode(sigB64),
    };
  } catch {
    return null;
  }
}

async function isSignatureValid(
  secret: string,
  payloadB64: string,
  sigBytes: Uint8Array
): Promise<boolean> {
  try {
    const key = await importHmacKey(secret, "verify");
    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as unknown as ArrayBuffer,
      encoder.encode(payloadB64)
    );
  } catch {
    return false;
  }
}

function parsePayload(payloadBytes: Uint8Array): SessionTokenPayload | null {
  try {
    const parsed = JSON.parse(decoder.decode(payloadBytes));
    return isValidPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

type VerifyFailReason = "invalid_format" | "bad_signature" | "expired" | "malformed_payload";

async function decodeAndVerify(
  token: string,
  secret: string
): Promise<{ payload: SessionTokenPayload } | VerifyFailReason> {
  const split = splitToken(token);
  if (!split) return "invalid_format";

  const decoded = decodeSegments(split.payloadB64, split.sigB64);
  if (!decoded) return "invalid_format";

  const valid = await isSignatureValid(secret, split.payloadB64, decoded.sigBytes);
  if (!valid) return "bad_signature";

  const payload = parsePayload(decoded.payloadBytes);
  if (!payload) return "malformed_payload";

  return { payload };
}

export async function verifySessionToken(
  token: string,
  secret: string,
  now: number = Math.floor(Date.now() / 1000)
): Promise<VerifyResult> {
  const result = await decodeAndVerify(token, secret);
  if (typeof result === "string") return { ok: false, reason: result };
  if (result.payload.exp < now) return { ok: false, reason: "expired" };
  return { ok: true, payload: result.payload };
}
