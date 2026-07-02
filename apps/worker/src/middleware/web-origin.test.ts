import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { requireWebOrigin } from "./web-origin";

type TestEnv = { APP_URL: string; TRUSTED_ORIGINS?: string };

function makeApp(env: TestEnv) {
  const app = new Hono<{ Bindings: Env }>();
  const next = vi.fn(async () => {});
  app.use("*", requireWebOrigin());
  app.get("/test", async (c) => {
    await next();
    return c.json({ ok: true });
  });
  return {
    fetch: (init?: RequestInit) =>
      app.fetch(new Request("https://worker.test/test", init), env as unknown as Env),
    next,
  };
}

describe("requireWebOrigin", () => {
  const APP_URL = "https://shadowwhisper.com";
  const TRUSTED_ORIGINS = "https://www.shadowwhisper.com,https://staging.shadowwhisper.com";

  it("rejects requests with no Origin or Referer header", async () => {
    const { fetch, next } = makeApp({ APP_URL, TRUSTED_ORIGINS });
    const res = await fetch();
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error_code: string };
    expect(body.error_code).toBe("er_origin_forbidden");
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts an Origin that exactly matches APP_URL", async () => {
    const { fetch, next } = makeApp({ APP_URL, TRUSTED_ORIGINS });
    const res = await fetch({ headers: { Origin: APP_URL } });
    expect(res.status).toBe(200);
    expect(next).toHaveBeenCalled();
  });

  it("accepts a Referer URL with a path under a trusted origin", async () => {
    const { fetch, next } = makeApp({ APP_URL, TRUSTED_ORIGINS });
    const res = await fetch({
      headers: { Referer: "https://www.shadowwhisper.com/en/try-it" },
    });
    expect(res.status).toBe(200);
    expect(next).toHaveBeenCalled();
  });

  it("rejects an untrusted origin", async () => {
    const { fetch, next } = makeApp({ APP_URL, TRUSTED_ORIGINS });
    const res = await fetch({ headers: { Origin: "https://evil.example.com" } });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error_code: string };
    expect(body.error_code).toBe("er_origin_forbidden");
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts only APP_URL when TRUSTED_ORIGINS is empty", async () => {
    const { fetch, next } = makeApp({ APP_URL, TRUSTED_ORIGINS: "" });
    const allowed = await fetch({ headers: { Origin: APP_URL } });
    expect(allowed.status).toBe(200);
    expect(next).toHaveBeenCalledTimes(1);

    const blocked = await fetch({ headers: { Origin: "https://www.shadowwhisper.com" } });
    expect(blocked.status).toBe(403);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
