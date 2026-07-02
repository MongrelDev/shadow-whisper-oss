import {
  expect,
  sendTranscriptErrorToPage,
  sendTranscriptToPage,
  seedExtensionStorage,
  test,
} from "./fixtures";

async function captureTextareaCaret(
  page: import("@playwright/test").Page,
  selector: string,
  value: string,
  caret: number
): Promise<void> {
  await page.locator(selector).fill(value);
  await page.evaluate(
    ({ targetSelector, selectionStart }) => {
      const el = document.querySelector(targetSelector);
      if (!(el instanceof HTMLTextAreaElement)) {
        throw new Error(`Expected textarea for ${targetSelector}`);
      }
      el.focus();
      el.setSelectionRange(selectionStart, selectionStart);
      document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    },
    { targetSelector: selector, selectionStart: caret }
  );
}

test.describe("Feature: Pill API error handling", () => {
  test("Scenario: rate limited transcription shows pill error and does not insert text", async ({
    context,
    testPage,
  }) => {
    await seedExtensionStorage(context, {
      sw_auth_token: "token-e2e",
      onboarding_completed: true,
      sw_mic_permission_granted: true,
    });
    await captureTextareaCaret(testPage, "#editor-textarea", "antes", 5);

    await sendTranscriptErrorToPage(context, testPage, "rate_limited");

    await expect(testPage.getByRole("status")).toContainText(
      "Too many requests. Try again in a moment."
    );
    await expect(testPage.locator("#editor-textarea")).toHaveValue("antes");
  });

  test("Scenario: quota exceeded transcription shows the paywall in the pill", async ({
    context,
    testPage,
  }) => {
    await seedExtensionStorage(context, {
      sw_auth_token: "token-e2e",
      onboarding_completed: true,
      sw_mic_permission_granted: true,
    });
    await captureTextareaCaret(testPage, "#editor-textarea", "", 0);

    await sendTranscriptErrorToPage(context, testPage, "quota_exceeded");

    await expect(testPage.getByText("Weekly limit reached")).toBeVisible();
    await expect(testPage.getByRole("button", { name: "Upgrade to Pro" })).toBeVisible();
    await expect(testPage.getByRole("button", { name: "Dismiss" })).toBeVisible();
  });

  test("Scenario: skill auto-apply failure inserts original transcript and shows pill error", async ({
    context,
    mockApi,
    testPage,
  }) => {
    mockApi.setTranscript("texto original");
    mockApi.setSkillExecuteStatus(429);
    await seedExtensionStorage(context, {
      sw_auth_token: "token-e2e",
      onboarding_completed: true,
      sw_mic_permission_granted: true,
      prefs: {
        defaultSkillId: "fix-grammar",
        autoApplyAfterDictation: true,
        selectedLanguages: ["en"],
      },
    });
    await captureTextareaCaret(testPage, "#editor-textarea", "", 0);

    await sendTranscriptToPage(context, testPage, "texto original");

    await expect(testPage.locator("#editor-textarea")).toHaveValue("texto original");
    await expect(testPage.getByRole("status")).toContainText(
      "Skill rate limited. Transcript inserted as-is."
    );
  });
});
