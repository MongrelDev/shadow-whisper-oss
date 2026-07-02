import { apiClient } from "~/lib/api-client";
import type { SkillListItem } from "~/lib/messaging/types";

const PARENT_ID = "sw-root";
const PASTE_TRANSCRIPT_ID = "sw-paste-transcript";
const SKILL_PREFIX = "sw-skill:";

let lastTranscript: string | null = null;
let cachedSkills: SkillListItem[] = [];
let skillsLoaded = false;

export function setLastTranscript(text: string): void {
  lastTranscript = text;
}

// Skills only change on install/uninstall, so hit the network once (or when
// forced by a skills:changed signal) and serve the cache for the frequent
// transcript-driven menu rebuilds.
async function fetchInstalledSkills(force = false): Promise<SkillListItem[]> {
  if (!force && skillsLoaded) return cachedSkills;
  try {
    const res = await apiClient.skills.$get({ query: {} });
    if (!res.ok) return cachedSkills;
    const data = (await res.json()) as { skills: SkillListItem[] };
    cachedSkills = data.skills.filter((s) => s.isInstalled);
    skillsLoaded = true;
    return cachedSkills;
  } catch {
    return cachedSkills;
  }
}

function classifyHttpError(status: number): string {
  if (status === 401) return "unauthenticated";
  if (status === 402) return "quota_exceeded";
  if (status === 429) return "rate_limited";
  return "skill_execute_failed";
}

async function executeSkill(skillId: string, text: string): Promise<string> {
  const res = await apiClient.skills[":id"]["execute-sync"].$post({
    param: { id: skillId },
    json: { inputText: text },
  });
  if (!res.ok) {
    throw Object.assign(new Error(`execute-sync HTTP ${res.status}`), {
      code: classifyHttpError(res.status),
    });
  }
  const { cleanText } = (await res.json()) as { cleanText: string };
  return cleanText;
}

async function writeClipboard(text: string): Promise<boolean> {
  // Service workers can't access navigator.clipboard directly.
  // Send to the active tab's content script to write clipboard.
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tabs[0]?.id;
  if (tabId == null) return false;

  try {
    await chrome.tabs.sendMessage(tabId, {
      target: "content",
      type: "bg:copy-to-clipboard",
      text,
    });
    return true;
  } catch {
    // Content script not available (chrome://, edge://, extension pages)
    return false;
  }
}

function showToast(tabId: number | undefined, message: string, variant: "info" | "error"): void {
  if (tabId == null) return;
  chrome.tabs
    .sendMessage(tabId, { target: "content", type: "bg:show-toast", message, variant })
    .catch(() => {});
}

async function handleSkillClick(skillId: string, selectionText: string): Promise<void> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tabs[0]?.id;

  try {
    const output = await executeSkill(skillId, selectionText);
    const copied = await writeClipboard(output);
    const msg = copied
      ? "Copied — press Ctrl+V to paste"
      : "Could not copy — content scripts unavailable on this page";
    showToast(tabId, msg, copied ? "info" : "error");
  } catch (e) {
    const code = (e as { code?: string }).code ?? "skill_execute_failed";
    showToast(tabId, `Skill failed: ${code}`, "error");
  }
}

async function handlePasteTranscript(): Promise<void> {
  if (!lastTranscript) return;
  const copied = await writeClipboard(lastTranscript);
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const msg = copied
    ? "Transcript copied — press Ctrl+V to paste"
    : "Could not copy — content scripts unavailable on this page";
  showToast(tabs[0]?.id, msg, copied ? "info" : "error");
}

export async function buildContextMenu(force = false): Promise<void> {
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: PARENT_ID,
    title: "Shadow Whisper",
    contexts: ["selection"],
  });

  const skills = await fetchInstalledSkills(force);

  for (const skill of skills) {
    chrome.contextMenus.create({
      id: `${SKILL_PREFIX}${skill.id}`,
      parentId: PARENT_ID,
      title: skill.displayName,
      contexts: ["selection"],
    });
  }

  if (skills.length > 0) {
    chrome.contextMenus.create({
      id: "sw-separator",
      parentId: PARENT_ID,
      type: "separator",
      contexts: ["selection"],
    });
  }

  chrome.contextMenus.create({
    id: PASTE_TRANSCRIPT_ID,
    parentId: PARENT_ID,
    title: "Paste last transcript",
    contexts: ["selection", "editable"],
    enabled: lastTranscript !== null,
  });
}

export function refreshContextMenu(): void {
  void buildContextMenu();
}

// Forces a skills refetch — call after the user installs/uninstalls a skill.
export function refreshSkillsContextMenu(): void {
  void buildContextMenu(true);
}

export function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  _tab?: chrome.tabs.Tab
): void {
  const menuItemId = String(info.menuItemId);

  if (menuItemId === PASTE_TRANSCRIPT_ID) {
    void handlePasteTranscript();
    return;
  }

  if (menuItemId.startsWith(SKILL_PREFIX) && info.selectionText) {
    const skillId = menuItemId.slice(SKILL_PREFIX.length);
    void handleSkillClick(skillId, info.selectionText);
  }
}
