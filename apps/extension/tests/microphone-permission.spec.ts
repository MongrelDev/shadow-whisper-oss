import {
  expect,
  openSidepanel,
  readExtensionStorage,
  seedExtensionStorage,
  test,
} from "./fixtures";

test.describe("Feature: Microphone permission", () => {
  test("Scenario: sidepanel shows grant button when microphone permission is missing", async ({
    context,
    extensionId,
  }) => {
    await seedExtensionStorage(context, {
      sw_auth_token: "token-e2e",
      onboarding_completed: true,
      sw_mic_permission_granted: false,
    });

    const sidepanel = await openSidepanel(context, extensionId);

    await expect(sidepanel.getByRole("button", { name: "Grant microphone access" })).toBeVisible();
    await expect(sidepanel.getByRole("button", { name: "Start recording" })).toBeHidden();
    await sidepanel.close();
  });

  test("Scenario: full permission grant flow opens permission tab, grants, closes, and updates sidepanel", async ({
    context,
    extensionId,
  }) => {
    await seedExtensionStorage(context, {
      sw_auth_token: "token-e2e",
      onboarding_completed: true,
      sw_mic_permission_granted: false,
    });
    const sidepanel = await openSidepanel(context, extensionId);

    const permissionPagePromise = context.waitForEvent("page", (page) =>
      page.url().includes("permission.html")
    );
    await sidepanel.getByRole("button", { name: "Grant microphone access" }).click();
    const permissionPage = await permissionPagePromise;
    await expect(permissionPage).toHaveURL(/permission\.html/);

    await permissionPage.locator("#grant").click();

    await expect
      .poll(() => readExtensionStorage<boolean>(context, "sw_mic_permission_granted"))
      .toBe(true);
    await expect.poll(() => permissionPage.isClosed()).toBe(true);
    await expect(sidepanel.getByRole("button", { name: "Start recording" })).toBeVisible();
    await sidepanel.close();
  });

  test("Scenario: sidepanel reacts to microphone permission storage changes without reload", async ({
    context,
    extensionId,
  }) => {
    await seedExtensionStorage(context, {
      sw_auth_token: "token-e2e",
      onboarding_completed: true,
      sw_mic_permission_granted: false,
    });
    const sidepanel = await openSidepanel(context, extensionId);
    await expect(sidepanel.getByRole("button", { name: "Grant microphone access" })).toBeVisible();

    await seedExtensionStorage(context, { sw_mic_permission_granted: true });

    await expect(sidepanel.getByRole("button", { name: "Start recording" })).toBeVisible();
    await expect(sidepanel.getByRole("button", { name: "Grant microphone access" })).toBeHidden();
    await sidepanel.close();
  });

  test("Scenario: microphone permission persists between sidepanel sessions", async ({
    context,
    extensionId,
  }) => {
    await seedExtensionStorage(context, {
      sw_auth_token: "token-e2e",
      onboarding_completed: true,
      sw_mic_permission_granted: true,
    });

    const firstSidepanel = await openSidepanel(context, extensionId);
    await expect(firstSidepanel.getByRole("button", { name: "Start recording" })).toBeVisible();
    await firstSidepanel.close();

    const secondSidepanel = await openSidepanel(context, extensionId);
    await expect(secondSidepanel.getByRole("button", { name: "Start recording" })).toBeVisible();
    await secondSidepanel.close();
  });
});
