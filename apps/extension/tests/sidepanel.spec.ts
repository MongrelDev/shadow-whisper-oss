import {
  expect,
  openSidepanel,
  readExtensionStorage,
  seedExtensionStorage,
  test,
} from "./fixtures";

test.describe("Sidepanel", () => {
  test("redirects unauthenticated users to login", async ({ context, extensionId, mockApi }) => {
    mockApi.setAuthenticated(false);

    const sidepanel = await openSidepanel(context, extensionId);

    await expect(sidepanel).toHaveURL(/#\/login/);
    await expect(sidepanel.getByRole("heading", { name: /sign in|entrar/i })).toBeVisible();
    await sidepanel.close();
  });

  test("renders authenticated home with mocked API data", async ({ context, extensionId }) => {
    await seedExtensionStorage(context, {
      sw_auth_token: "token-e2e",
      onboarding_completed: true,
      sw_mic_permission_granted: true,
    });

    const sidepanel = await openSidepanel(context, extensionId);

    await expect(sidepanel.getByText(/E2E User/)).toBeVisible();
    await expect(sidepanel.getByRole("button", { name: /start recording|iniciar/i })).toBeVisible();
    await expect(sidepanel.getByRole("grid", { name: "Usage heatmap" })).toBeVisible();
    await sidepanel.close();
  });

  test("persists settings changes to chrome.storage.local", async ({ context, extensionId }) => {
    await seedExtensionStorage(context, {
      sw_auth_token: "token-e2e",
      onboarding_completed: true,
      sw_mic_permission_granted: true,
      prefs: { selectedLanguages: ["en"], autoOpenPanelOnHotkey: true },
    });

    const sidepanel = await openSidepanel(context, extensionId);
    await sidepanel.goto(`chrome-extension://${extensionId}/sidepanel.html#/settings`);

    await sidepanel.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes("Settings") || text.includes("Configurações");
    });

    await expect(sidepanel.getByRole("heading", { name: /settings|configurações/i })).toBeVisible();
    await sidepanel.evaluate(() => {
      const button = Array.from(document.querySelectorAll("button")).find((candidate) =>
        /Dark|Escuro/.test(candidate.textContent ?? "")
      );
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error(`Dark theme button not found. Body: ${document.body.innerText}`);
      }
      button.click();
    });
    await sidepanel.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button")).filter((candidate) =>
        /Portuguese|Português/.test(candidate.textContent ?? "")
      );
      const button = buttons[0];
      if (!(button instanceof HTMLButtonElement))
        throw new Error("Portuguese locale button not found");
      button.click();
    });
    await sidepanel.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button")).filter((candidate) =>
        /Portuguese|Português/.test(candidate.textContent ?? "")
      );
      const button = buttons.at(-1);
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error("Portuguese transcription language button not found");
      }
      button.click();
    });

    await expect
      .poll(() => readExtensionStorage<Record<string, unknown>>(context, "prefs"))
      .toMatchObject({
        locale: "pt-BR",
        selectedLanguages: ["en", "pt"],
      });

    await expect(sidepanel.locator("html")).toHaveClass(/dark/);
    await expect.poll(() => sidepanel.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
    await sidepanel.close();
  });

  test("shows installed skills from the mocked API", async ({ context, extensionId }) => {
    await seedExtensionStorage(context, {
      sw_auth_token: "token-e2e",
      onboarding_completed: true,
    });

    const sidepanel = await openSidepanel(context, extensionId);
    await sidepanel.goto(`chrome-extension://${extensionId}/sidepanel.html#/skills`);

    await expect(sidepanel.getByRole("heading", { name: /skills/i })).toBeVisible();
    await expect(sidepanel.getByText("Corrigir gramática")).toBeVisible();
    await expect(sidepanel.getByText("Polir texto")).toBeVisible();
    await sidepanel.close();
  });
});
