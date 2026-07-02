const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function parseCookie(header: string, name: string): string | null {
  if (!header) return null;
  const pairs = header.split(/;\s*/);
  const prefix = `${name}=`;
  for (const pair of pairs) {
    if (pair.startsWith(prefix)) {
      try {
        return decodeURIComponent(pair.slice(prefix.length));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  domain?: string;
  maxAge?: number;
  path?: string;
}

const SAME_SITE_MAP: Record<"lax" | "strict" | "none", string> = {
  lax: "Lax",
  strict: "Strict",
  none: "None",
};

function valueFlags(opts: CookieOptions): string[] {
  const parts: string[] = [];
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  return parts;
}

function boolFlags(opts: CookieOptions): string[] {
  const parts: string[] = [];
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  if (opts.sameSite) parts.push(`SameSite=${SAME_SITE_MAP[opts.sameSite]}`);
  return parts;
}

export function serializeCookie(name: string, value: string, opts: CookieOptions = {}): string {
  const parts = [...valueFlags(opts), ...boolFlags(opts)];
  const flags = parts.length > 0 ? `; ${parts.join("; ")}` : "";
  return `${name}=${encodeURIComponent(value)}${flags}`;
}

export async function hmacAgentId(secret: string, cookie: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(cookie));
  return base64UrlEncode(new Uint8Array(sig));
}
