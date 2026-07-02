import { describe, expect, it } from "vitest";
import { insertTestUser } from "../setup/db";
import { readJson, workerJson } from "../setup/request";

interface EmailStatusResponse {
  verified: boolean;
}

describe("POST /auth/email-status", () => {
  it("returns verified=true for a verified user", async () => {
    const user = await insertTestUser({
      email: "verified@example.com",
      emailVerified: true,
    });

    const response = await workerJson("/auth/email-status", {
      method: "POST",
      json: { email: user.email },
    });

    expect(response.status).toBe(200);
    await expect(readJson<EmailStatusResponse>(response)).resolves.toEqual({ verified: true });
  });

  it("returns verified=false for an unverified user", async () => {
    const user = await insertTestUser({
      email: "pending@example.com",
      emailVerified: false,
    });

    const response = await workerJson("/auth/email-status", {
      method: "POST",
      json: { email: user.email },
    });

    expect(response.status).toBe(200);
    await expect(readJson<EmailStatusResponse>(response)).resolves.toEqual({ verified: false });
  });

  it("returns verified=false when the email does not exist", async () => {
    const response = await workerJson("/auth/email-status", {
      method: "POST",
      json: { email: "missing@example.com" },
    });

    expect(response.status).toBe(200);
    await expect(readJson<EmailStatusResponse>(response)).resolves.toEqual({ verified: false });
  });

  it("rejects invalid payloads", async () => {
    const response = await workerJson("/auth/email-status", {
      method: "POST",
      json: { email: "" },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error_code: "er_validation",
    });
  });
});
