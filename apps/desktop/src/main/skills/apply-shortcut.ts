import { Notification } from "electron";
import { typedRequest } from "../ipc/api-client";
import {
  getSelectedText,
  insertTextAtCursor,
  checkAccessibility,
} from "../services/KeyboardService";
import { areGlobalShortcutsBlocked } from "../services/InteractionModeService";
import { sendPillSkillApplying, showPillWindow, hidePillWindow } from "../windows/pill";
import { getConfig, setConfig } from "../services/ConfigStore";

function notify(title: string, body: string): void {
  if (!Notification.isSupported()) return;
  new Notification({ title, body, silent: true }).show();
}

function getSelectionOrNotify(): string | null {
  if (!checkAccessibility(false)) {
    notify("ShadowWhisper", "Accessibility permission required to read selection.");
    return null;
  }
  const selected = getSelectedText();
  if (!selected || selected.trim().length === 0) {
    notify("ShadowWhisper", "Select some text before triggering a skill.");
    return null;
  }
  return selected;
}

function deriveOs(): "macos" | "windows" | "linux" {
  switch (process.platform) {
    case "darwin":
      return "macos";
    case "win32":
      return "windows";
    default:
      return "linux";
  }
}

async function dispatchExecution(skillId: string, inputText: string): Promise<void> {
  showPillWindow();
  sendPillSkillApplying(true);
  try {
    const result = await typedRequest((c) =>
      c.skills[":id"]["execute-sync"].$post({
        param: { id: skillId },
        json: {
          inputText,
          os: deriveOs(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        },
      })
    );
    if (!result.success || !result.data) {
      notify("ShadowWhisper", "Skill failed to start.");
      return;
    }
    const insertResult = await insertTextAtCursor(result.data.cleanText);
    if (insertResult === "Pasted") {
      const config = getConfig();
      setConfig({
        skills: { successfulExecutionCount: config.skills.successfulExecutionCount + 1 },
      });
    } else {
      notify("ShadowWhisper", "Failed to paste skill output.");
    }
  } finally {
    sendPillSkillApplying(false);
    hidePillWindow();
  }
}

export async function applySkillToSelection(skillId: string): Promise<void> {
  if (areGlobalShortcutsBlocked()) return;
  const selected = getSelectionOrNotify();
  if (selected === null) return;
  await dispatchExecution(skillId, selected);
}
