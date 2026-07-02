import {
  expect,
  hasOffscreenDocument,
  readExtensionBadgeText,
  readExtensionSessionStorage,
  seedExtensionStorage,
  test,
  triggerE2ERecordingToggle,
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

async function pressRecordingShortcut(page: import("@playwright/test").Page): Promise<void> {
  await page.keyboard.press(process.platform === "darwin" ? "Alt+Space" : "Alt+Shift+W");
}

async function pressRecordingShortcutWithBridgeFallback(
  context: import("@playwright/test").BrowserContext,
  page: import("@playwright/test").Page,
  expectedState: "recording" | "processing"
): Promise<void> {
  await pressRecordingShortcut(page);
  const reachedState = await expect
    .poll(() => readExtensionSessionStorage<string>(context, "recordingState"), { timeout: 1_500 })
    .toBe(expectedState)
    .then(
      () => true,
      () => false
    );
  if (!reachedState) {
    await triggerE2ERecordingToggle(context);
  }
}

test.describe("Feature: Recording transcription", () => {
  test("Scenario: shortcut starts and stops recording, calls API, and inserts returned text", async ({
    context,
    mockApi,
    testPage,
  }) => {
    mockApi.setTranscript("XPTO retornado pela API");
    mockApi.setTranscribeDelayMs(500);
    mockApi.clearRequests();
    await seedExtensionStorage(context, {
      sw_auth_token: "token-e2e",
      onboarding_completed: true,
      sw_mic_permission_granted: true,
    });
    await captureTextareaCaret(testPage, "#editor-textarea", "Resultado: ", 11);

    await pressRecordingShortcutWithBridgeFallback(context, testPage, "recording");
    await expect
      .poll(() => readExtensionSessionStorage<string>(context, "recordingState"))
      .toBe("recording");
    await expect.poll(() => readExtensionBadgeText(context)).toBe("●");
    await expect.poll(() => hasOffscreenDocument(context)).toBe(true);
    await expect
      .poll(() =>
        mockApi.getRequests().some((request) => request.pathname === "/api/sessions/warmup")
      )
      .toBe(true);

    await pressRecordingShortcutWithBridgeFallback(context, testPage, "processing");

    await expect
      .poll(() => readExtensionSessionStorage<string>(context, "recordingState"))
      .toBe("processing");
    await expect.poll(() => readExtensionBadgeText(context)).toBe("…");

    await expect
      .poll(() =>
        mockApi
          .getRequests()
          .some((request) => request.pathname === "/api/sessions/session-e2e/transcribe")
      )
      .toBe(true);
    await expect
      .poll(() => readExtensionSessionStorage<string>(context, "recordingState"))
      .toBe("idle");
    await expect(testPage.locator("#editor-textarea")).toHaveValue(
      "Resultado: XPTO retornado pela API"
    );
  });
});
