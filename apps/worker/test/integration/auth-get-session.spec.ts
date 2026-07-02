import { describe, expect, it } from "vitest";
import { createAuthenticatedUser } from "../setup/auth";
import { authedFetch, readJson, workerFetch } from "../setup/request";

interface AuthSessionResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  session: {
    id: string;
    userId: string;
  };
}

describe("GET /api/auth/get-session", () => {
  it("returns null without a signed-in session", async () => {
    const response = await workerFetch("/api/auth/get-session");

    expect(response.status).toBe(200);
    await expect(readJson<null>(response)).resolves.toBeNull();
  });

  it("returns the current session payload for a signed-in user", async () => {
    const user = await createAuthenticatedUser({ email: "session@example.com" });

    const response = await authedFetch("/api/auth/get-session", user.cookie);

    expect(response.status).toBe(200);

    await expect(readJson<AuthSessionResponse>(response)).resolves.toMatchObject({
      user: {
        id: user.user.id,
        email: user.user.email,
        name: user.user.name,
      },
      session: {
        userId: user.user.id,
      },
    });
  });
});
