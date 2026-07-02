import { expect, test, triggerE2EContextMenuClick } from "./fixtures";

test.describe("Feature: Browser context menu skills", () => {
  test("Scenario: selected text is sent to the skill API and the normalized result is copied", async ({
    context,
    mockApi,
    testPage,
  }) => {
    mockApi.setTransformedText("texto normal");
    mockApi.clearRequests();
    const selectedText = "textu estranho";

    await testPage.locator("#selectable-text").evaluate((el, text) => {
      el.textContent = text;
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      if (!selection) throw new Error("No document selection");
      selection.removeAllRanges();
      selection.addRange(range);
    }, selectedText);

    await triggerE2EContextMenuClick(context, "sw-skill:fix-grammar", selectedText);

    await expect
      .poll(() => {
        const request = mockApi
          .getRequests()
          .find((candidate) => candidate.pathname === "/skills/preview-execute");
        return request?.postData ?? "";
      })
      .toContain('"inputText":"textu estranho"');
    await expect
      .poll(() => testPage.evaluate(() => navigator.clipboard.readText()))
      .toBe("texto normal");
  });
});
