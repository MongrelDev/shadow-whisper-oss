import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { getIp, ipHash } from "./ip-hash";

describe("ipHash", () => {
  it("returns the same hash for the same secret and ip", async () => {
    const a = await ipHash("secret-1", "1.2.3.4");
    const b = await ipHash("secret-1", "1.2.3.4");
    expect(a).toBe(b);
  });

  it("returns different hashes for different secrets", async () => {
    const a = await ipHash("secret-1", "1.2.3.4");
    const b = await ipHash("secret-2", "1.2.3.4");
    expect(a).not.toBe(b);
  });

  it("returns different hashes for different ips", async () => {
    const a = await ipHash("secret-1", "1.2.3.4");
    const b = await ipHash("secret-1", "5.6.7.8");
    expect(a).not.toBe(b);
  });

  it("returns a 64-character hex string", async () => {
    const hash = await ipHash("secret", "1.2.3.4");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("getIp", () => {
  function makeApp() {
    let captured = "";
    const app = new Hono();
    app.get("/", (c) => {
      captured = getIp(c);
      return c.text("ok");
    });
    return {
      run: async (headers: Record<string, string>) => {
        await app.fetch(new Request("https://test/", { headers }));
        return captured;
      },
    };
  }

  it("prefers CF-Connecting-IP over x-forwarded-for", async () => {
    const { run } = makeApp();
    const ip = await run({
      "CF-Connecting-IP": "1.1.1.1",
      "x-forwarded-for": "2.2.2.2, 3.3.3.3",
    });
    expect(ip).toBe("1.1.1.1");
  });

  it("falls back to first x-forwarded-for entry when CF header missing", async () => {
    const { run } = makeApp();
    const ip = await run({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" });
    expect(ip).toBe("2.2.2.2");
  });

  it("returns 0.0.0.0 when no IP headers present", async () => {
    const { run } = makeApp();
    const ip = await run({});
    expect(ip).toBe("0.0.0.0");
  });
});
