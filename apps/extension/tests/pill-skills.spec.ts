import {
  expect,
  readExtensionStorage,
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

async function expandPill(page: import("@playwright/test").Page): Promise<void> {
  await page.locator("shadow-whisper-pill").evaluate((host) => {
    const root = host.shadowRoot;
    const pill = root?.querySelector('[data-shadow-whisper="pill"]');
    if (!(pill instanceof HTMLElement)) throw new Error("Pill container not found");
    pill.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    pill.focus();
  });
}

test.describe("Feature: Pill skill selection", () => {
  test("Scenario: user selects a default skill in the pill and auto-applies it after dictation", async ({
    context,
    mockApi,
    testPage,
  }) => {
    mockApi.setTranscript("textu com erru");
    mockApi.setTransformedText("texto com erro corrigido");
    mockApi.clearRequests();
    await seedExtensionStorage(context, {
      sw_auth_token: "token-e2e",
      onboarding_completed: true,
      sw_mic_permission_granted: true,
    });
    await captureTextareaCaret(testPage, "#editor-textarea", "", 0);

    await expandPill(testPage);
    await testPage.getByRole("button", { name: "Open skills menu" }).click();
    await testPage.getByRole("option", { name: "Corrigir gramática" }).click();
    await testPage.getByRole("switch", { name: "Apply after dictation" }).click();

    await expect
      .poll(() => readExtensionStorage<Record<string, unknown>>(context, "prefs"))
      .toMatchObject({
        defaultSkillId: "fix-grammar",
        autoApplyAfterDictation: true,
      });

    await sendTranscriptToPage(context, testPage, "textu com erru");

    await expect
      .poll(() =>
        mockApi
          .getRequests()
          .some((request) => request.pathname === "/skills/fix-grammar/execute-sync")
      )
      .toBe(true);
    await expect
      .poll(
        () =>
          mockApi
            .getRequests()
            .find((request) => request.pathname === "/skills/fix-grammar/execute-sync")?.postData ??
          ""
      )
      .toContain('"inputText":"textu com erru"');
    await expect(testPage.locator("#editor-textarea")).toHaveValue("texto com erro corrigido");
  });
});
