import { describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "./auth-token";

const SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const OTHER_SECRET = "other-secret-bbbbbbbbbbbbbbbbbbbbbbbbbb";

const futurePayload = () => ({
  sid: "session-123",
  uid: "user-abc",
  exp: Math.floor(Date.now() / 1000) + 3600,
});

describe("signSessionToken / verifySessionToken", () => {
  it("round-trips a payload", async () => {
    const payload = futurePayload();
    const token = await signSessionToken(payload, SECRET);
    const result = await verifySessionToken(token, SECRET);
    expect(result).toEqual({ ok: true, payload });
  });

  it("returns bad_signature when payload segment is tampered", async () => {
    const payload = futurePayload();
    const token = await signSessionToken(payload, SECRET);
    const parts = token.split(".");
    const head = parts[0]!;
    const sig = parts[1]!;
    const tamperedHead = head.slice(0, -1) + (head.slice(-1) === "A" ? "B" : "A");
    const tampered = `${tamperedHead}.${sig}`;
    const result = await verifySessionToken(tampered, SECRET);
    expect(result).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("returns bad_signature when signature segment is tampered", async () => {
    const payload = futurePayload();
    const token = await signSessionToken(payload, SECRET);
    const parts = token.split(".");
    const head = parts[0]!;
    const sig = parts[1]!;
    const tamperedSig = (sig[0] === "A" ? "B" : "A") + sig.slice(1);
    const tampered = `${head}.${tamperedSig}`;
    const result = await verifySessionToken(tampered, SECRET);
    expect(result).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("returns expired when payload.exp < now", async () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = { sid: "s", uid: "u", exp: now - 10 };
    const token = await signSessionToken(payload, SECRET);
    const result = await verifySessionToken(token, SECRET, now);
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("returns bad_signature when verifying with wrong secret", async () => {
    const token = await signSessionToken(futurePayload(), SECRET);
    const result = await verifySessionToken(token, OTHER_SECRET);
    expect(result).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("returns invalid_format when token has no dot", async () => {
    const result = await verifySessionToken("notavalidtoken", SECRET);
    expect(result).toEqual({ ok: false, reason: "invalid_format" });
  });

  it("returns invalid_format when token has too many dots", async () => {
    const result = await verifySessionToken("a.b.c", SECRET);
    expect(result).toEqual({ ok: false, reason: "invalid_format" });
  });

  it("returns malformed_payload when payload segment is not valid base64url JSON", async () => {
    const result = await verifySessionToken("!!!notbase64!!!.AAAA", SECRET);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(["invalid_format", "malformed_payload"]).toContain(result.reason);
    }
  });

  it("returns malformed_payload when payload JSON is invalid", async () => {
    const badPayloadB64 = btoa("not json")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const token = `${badPayloadB64}.AAAA`;
    const result = await verifySessionToken(token, SECRET);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(["bad_signature", "malformed_payload"]).toContain(result.reason);
    }
  });

  it("returns malformed_payload when signed payload has invalid JSON", async () => {
    const badPayloadB64 = btoa("not json")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(badPayloadB64));
    const sigBytes = new Uint8Array(sig);
    let bin = "";
    for (let i = 0; i < sigBytes.length; i++) bin += String.fromCharCode(sigBytes[i]!);
    const sigB64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const token = `${badPayloadB64}.${sigB64}`;
    const result = await verifySessionToken(token, SECRET);
    expect(result).toEqual({ ok: false, reason: "malformed_payload" });
  });

  it("accepts payload without sid", async () => {
    const partial = { uid: "u", exp: Math.floor(Date.now() / 1000) + 60 };
    const token = await signSessionToken(partial, SECRET);
    const result = await verifySessionToken(token, SECRET);
    expect(result).toEqual({ ok: true, payload: partial });
  });

  it("returns malformed_payload when uid wrong type", async () => {
    const bad = { sid: "s", uid: 123, exp: Math.floor(Date.now() / 1000) + 60 };
    const token = await signSessionToken(bad as never, SECRET);
    const result = await verifySessionToken(token, SECRET);
    expect(result).toEqual({ ok: false, reason: "malformed_payload" });
  });

  it("returns malformed_payload when exp wrong type", async () => {
    const bad = { sid: "s", uid: "u", exp: "soon" };
    const token = await signSessionToken(bad as never, SECRET);
    const result = await verifySessionToken(token, SECRET);
    expect(result).toEqual({ ok: false, reason: "malformed_payload" });
  });
});
