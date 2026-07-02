import { describe, expect, it } from "vitest";
import { readJson, workerFetch } from "../setup/request";

interface PlanInfo {
  name: string;
  availability: string;
  monthly: { amountInCents: number; currency: string };
  annual: { amountInCents: number; currency: string };
  featureKeys: string[];
  recommended?: boolean;
  annualSavingsInMonths?: number;
  wordLimit?: number;
}

describe("GET /billing/plans", () => {
  it("returns the public plans payload", async () => {
    const response = await workerFetch("/billing/plans");

    expect(response.status).toBe(200);

    const body = await readJson<PlanInfo[]>(response);

    expect(body.map((plan) => plan.name)).toEqual(["free", "pro", "byok"]);
    expect(body.find((plan) => plan.name === "free")).toMatchObject({
      availability: "active",
      monthly: { amountInCents: 0, currency: "USD" },
      wordLimit: 2000,
    });
    expect(body.find((plan) => plan.name === "pro")).toMatchObject({
      availability: "active",
      recommended: true,
      annualSavingsInMonths: 2,
    });
    expect(body.find((plan) => plan.name === "byok")).toMatchObject({
      availability: "coming_soon",
    });
  });

  it("returns BRL pricing for Brazil requests", async () => {
    const response = await workerFetch("/billing/plans", {
      headers: {
        "cf-ipcountry": "BR",
      },
    });

    expect(response.status).toBe(200);

    const body = await readJson<PlanInfo[]>(response);

    expect(body.find((plan) => plan.name === "byok")).toMatchObject({
      monthly: { amountInCents: 499, currency: "BRL" },
      annual: { amountInCents: 4990, currency: "BRL" },
    });
  });
});
