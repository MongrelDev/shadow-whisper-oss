import { expect, expectPillHost, test } from "./fixtures";

test.describe("Feature: Shadow Whisper pill", () => {
  test("Scenario: pill host is injected and exposes its internals in E2E mode", async ({
    testPage,
  }) => {
    const pillHost = testPage.locator("shadow-whisper-pill");

    await expect(pillHost).toBeAttached();
    await expect(pillHost).toHaveCount(1);
    await expect(
      testPage.evaluate(() =>
        Boolean(
          document
            .querySelector("shadow-whisper-pill")
            ?.shadowRoot?.querySelector('[data-shadow-whisper="pill"]')
        )
      )
    ).resolves.toBe(true);
  });

  test("Scenario: pill survives client-side navigation", async ({ page, testServerUrl }) => {
    await page.goto(`${testServerUrl}/test-page-spa.html`);
    await expectPillHost(page);

    await page.getByRole("button", { name: "Route B" }).click();

    await expect(page.locator("#app")).toHaveText("Route B content");
    await expect(page.locator("shadow-whisper-pill")).toHaveCount(1);
  });
});
