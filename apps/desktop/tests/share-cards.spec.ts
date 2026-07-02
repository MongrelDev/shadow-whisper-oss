import { test, expect } from "./fixtures";

test.describe("Feature: Cards de compartilhamento", () => {
  test("carrega dados sob demanda e nao exibe email no card", async ({ mainWindow, mockApi }) => {
    await mainWindow.waitForURL(/app/, { timeout: 10_000 });

    await expect
      .poll(
        () => mockApi.getRequests().some((request) => request.pathname === "/api/usage/stats"),
        {
          timeout: 5_000,
        }
      )
      .toBe(true);
    expect(
      mockApi.getRequests().some((request) => request.pathname === "/api/usage/share-card")
    ).toBe(false);

    await mainWindow.locator("button").filter({ hasText: "0/0" }).click();
    await mainWindow.getByRole("button", { name: "Compartilhar", exact: true }).click();

    await expect(mainWindow.getByRole("heading", { name: "Compartilhar status" })).toBeVisible();
    await expect
      .poll(
        () => mockApi.getRequests().some((request) => request.pathname === "/api/usage/share-card"),
        { timeout: 5_000 }
      )
      .toBe(true);

    const preview = mainWindow.getByRole("dialog").last();
    await expect(preview.getByText("124K palavras ditadas")).toBeVisible();
    await expect(preview.getByText("e2e@example.com")).toHaveCount(0);
  });
});
