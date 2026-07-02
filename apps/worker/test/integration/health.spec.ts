import { describe, expect, it } from "vitest";
import { readJson, workerFetch } from "../setup/request";

interface HealthResponse {
  status: string;
  timestamp: number;
}

describe("GET /health", () => {
  it("returns ok with a numeric timestamp", async () => {
    const response = await workerFetch("/health", {
      headers: {
        origin: "http://localhost:3001",
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:3001");

    const body = await readJson<HealthResponse>(response);

    expect(body.status).toBe("ok");
    expect(typeof body.timestamp).toBe("number");
  });
});
