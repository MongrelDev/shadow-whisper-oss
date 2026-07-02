import { expect, sendTranscriptToPage, test } from "./fixtures";

async function captureTextareaSelection(
  page: import("@playwright/test").Page,
  selector: string,
  value: string,
  start: number,
  end: number
): Promise<void> {
  await page.locator(selector).fill(value);
  await page.evaluate(
    ({ targetSelector, selectionStart, selectionEnd }) => {
      const el = document.querySelector(targetSelector);
      if (!(el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement)) {
        throw new Error(`Expected text input for ${targetSelector}`);
      }
      el.focus();
      el.setSelectionRange(selectionStart, selectionEnd);
      document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    },
    { targetSelector: selector, selectionStart: start, selectionEnd: end }
  );
}

async function captureContentEditableSelection(
  page: import("@playwright/test").Page,
  selector: string,
  value: string,
  start: number,
  end: number
): Promise<void> {
  await page.locator(selector).evaluate((el, nextValue) => {
    el.textContent = nextValue;
  }, value);
  await page.evaluate(
    ({ targetSelector, selectionStart, selectionEnd }) => {
      const el = document.querySelector(targetSelector);
      if (!(el instanceof HTMLElement) || !el.isContentEditable) {
        throw new Error(`Expected contenteditable for ${targetSelector}`);
      }
      const textNode = el.firstChild;
      if (!textNode) throw new Error(`No text node for ${targetSelector}`);
      const range = document.createRange();
      range.setStart(textNode, selectionStart);
      range.setEnd(textNode, selectionEnd);
      const selection = window.getSelection();
      if (!selection) throw new Error("No document selection");
      selection.removeAllRanges();
      selection.addRange(range);
      el.focus();
      document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    },
    { targetSelector: selector, selectionStart: start, selectionEnd: end }
  );
}

test.describe("Transcript insertion", () => {
  test("inserts transcript at the textarea caret", async ({ context, testPage }) => {
    await captureTextareaSelection(testPage, "#editor-textarea", "inicio  fim", 7, 7);

    await sendTranscriptToPage(context, testPage, "texto transcrito");

    await expect(testPage.locator("#editor-textarea")).toHaveValue("inicio texto transcrito fim");
  });

  test("replaces selected textarea text", async ({ context, testPage }) => {
    await captureTextareaSelection(testPage, "#editor-textarea", "texto antigo aqui", 6, 12);

    await sendTranscriptToPage(context, testPage, "texto transcrito");

    await expect(testPage.locator("#editor-textarea")).toHaveValue("texto texto transcrito aqui");
  });

  test("inserts transcript into input text", async ({ context, testPage }) => {
    await captureTextareaSelection(testPage, "#input-field", "buscar: ", 8, 8);

    await sendTranscriptToPage(context, testPage, "texto transcrito");

    await expect(testPage.locator("#input-field")).toHaveValue("buscar: texto transcrito");
  });

  test("replaces selected contenteditable text", async ({ context, testPage }) => {
    await captureContentEditableSelection(testPage, "#rich-editor", "textu com erru", 0, 14);

    await sendTranscriptToPage(context, testPage, "texto com erro corrigido");

    await expect(testPage.locator("#rich-editor")).toHaveText("texto com erro corrigido");
  });

  test("copies to clipboard when no supported text target is captured", async ({
    context,
    testPage,
  }) => {
    await testPage.locator("#canvas-editor").focus();
    await testPage.evaluate(() => {
      document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    });

    await sendTranscriptToPage(context, testPage, "texto transcrito");

    await expect
      .poll(() => testPage.evaluate(() => navigator.clipboard.readText()))
      .toBe("texto transcrito");
  });
});
