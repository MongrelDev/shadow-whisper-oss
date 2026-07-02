import {
  expect,
  openSidepanel,
  readExtensionStorage,
  seedExtensionStorage,
  test,
} from "./fixtures";

test.describe("Feature: Onboarding", () => {
  test("Scenario: first authenticated open walks through onboarding and persists completion", async ({
    context,
    extensionId,
  }) => {
    await seedExtensionStorage(context, {
      sw_auth_token: "token-e2e",
      onboarding_completed: false,
    });

    const sidepanel = await openSidepanel(context, extensionId);

    await expect(
      sidepanel.getByRole("heading", { name: "Welcome to ShadowWhisper" })
    ).toBeVisible();

    await sidepanel.getByRole("button", { name: "Next", exact: true }).click();
    await expect(sidepanel.getByRole("heading", { name: "Microphone Access" })).toBeVisible();

    await sidepanel.getByRole("button", { name: "Next", exact: true }).click();
    await expect(sidepanel.getByRole("heading", { name: "Keyboard Shortcut" })).toBeVisible();

    await sidepanel.getByRole("button", { name: "Next", exact: true }).click();
    await expect(sidepanel.getByRole("heading", { name: "Skills" })).toBeVisible();

    await sidepanel.getByRole("button", { name: "Next", exact: true }).click();
    await expect(sidepanel.getByRole("heading", { name: "You're all set!" })).toBeVisible();

    await sidepanel.getByRole("button", { name: "Start using ShadowWhisper" }).click();

    await expect(sidepanel.getByRole("heading", { name: "Welcome to ShadowWhisper" })).toBeHidden();
    await expect
      .poll(() => readExtensionStorage<boolean>(context, "onboarding_completed"))
      .toBe(true);
    await sidepanel.close();
  });

  test("Scenario: changing onboarding language updates copy and persists locale", async ({
    context,
    extensionId,
  }) => {
    await seedExtensionStorage(context, {
      sw_auth_token: "token-e2e",
      onboarding_completed: false,
    });

    const sidepanel = await openSidepanel(context, extensionId);
    await sidepanel.getByRole("button", { name: "🇧🇷 PT" }).click();

    await expect(
      sidepanel.getByRole("heading", { name: "Bem-vindo ao ShadowWhisper" })
    ).toBeVisible();
    await expect
      .poll(() => readExtensionStorage<Record<string, unknown>>(context, "prefs"))
      .toMatchObject({ locale: "pt-BR" });
    await sidepanel.close();
  });

  test("Scenario: settings can reset onboarding for the next open", async ({
    context,
    extensionId,
  }) => {
    await seedExtensionStorage(context, {
      sw_auth_token: "token-e2e",
      onboarding_completed: true,
      prefs: { locale: "en", selectedLanguages: ["en"] },
    });

    const sidepanel = await openSidepanel(context, extensionId);
    await sidepanel.goto(`chrome-extension://${extensionId}/sidepanel.html#/settings`);
    await expect(sidepanel.getByRole("heading", { name: "Settings" })).toBeVisible();

    await sidepanel.getByRole("button", { name: "Replay" }).click();

    await expect(
      sidepanel.getByRole("heading", { name: "Welcome to ShadowWhisper" })
    ).toBeVisible();
    await expect
      .poll(() => readExtensionStorage<boolean>(context, "onboarding_completed"))
      .toBe(false);
    await sidepanel.close();
  });
});
