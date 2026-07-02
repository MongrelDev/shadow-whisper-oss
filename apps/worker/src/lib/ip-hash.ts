import type { Context } from "hono";

export async function ipHash(secret: string, ip: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(ip));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getIp(c: Context): string {
  const cf = c.req.header("CF-Connecting-IP");
  if (cf) return cf;
  const xff = c.req.header("x-forwarded-for");
  return xff?.split(",")[0]?.trim() ?? "0.0.0.0";
}
