import { globalShortcut, clipboard } from "electron";
import * as nativeInput from "@whisper/native-input";
import {
  showPillWindow,
  sendPillCancelShortcut,
  sendPillViewLastDiff,
  broadcastRecordingStop,
} from "../windows/pill";
import { getConfig, getShortcuts, setShortcut, setSkillShortcuts } from "./ConfigStore";
import { getLastTranscriptText } from "./last-transcript-store";
import {
  insertTextAtCursor,
  checkAccessibility,
  getSelectedText,
  getFocusedAppContext,
} from "./KeyboardService";
import { pasteViaClipboard } from "./clipboard-paste";
import { areGlobalShortcutsBlocked, getInteractionMode } from "./InteractionModeService";
import { applySkillToSelection } from "../skills/apply-shortcut";
import { m } from "../../renderer/paraglide/messages";
import { beginRecordingContext } from "./recording-context";
import { beginActionModeContext } from "./action-mode-context";

// Track recording state for toggle behavior
let isRecording = false;
let isActionModeRecording = false;

let cancelShortcutAccelerator: string | null = null;

let onRecordingStart: (() => void) | null = null;
let onActionModeStart: (() => void) | null = null;

export function setRecordingCallbacks(start: () => void): void {
  onRecordingStart = start;
}

export function setActionModeCallbacks(start: () => void): void {
  onActionModeStart = start;
}

export function setIsActionModeRecording(recording: boolean): void {
  isActionModeRecording = recording;
}

/**
 * Set recording state (called from main process when state changes)
 */
export function setIsRecording(recording: boolean): void {
  isRecording = recording;
}

/**
 * Toggle recording callback — shared between setup and dynamic update.
 */
function shouldIgnoreShortcut(): boolean {
  if (areGlobalShortcutsBlocked()) return true;
  const mode = getInteractionMode();
  if (mode === "processing-transcription") return true;
  if (mode === "recording-audio" && !isRecording) return true;
  return false;
}

function toggleRecording(): void {
  if (shouldIgnoreShortcut()) return;
  if (isActionModeRecording) return;

  if (!isRecording) {
    // RESEARCH Pitfall 2: must capture frontmost PID synchronously, BEFORE the
    // overlay paints — otherwise frontmostApplication returns Shadow's own pid.
    const targetPid = nativeInput.getFrontmostPid();
    const targetWindowHandle = nativeInput.getForegroundWindowHandle();
    beginRecordingContext(targetPid, targetWindowHandle);
    isRecording = true;
    onRecordingStart?.();
  } else {
    broadcastRecordingStop();
    // Note: isRecording will be set to false by onRecordingStop callback
  }
}

function shouldIgnoreActionModeShortcut(): boolean {
  if (areGlobalShortcutsBlocked()) return true;
  const mode = getInteractionMode();
  if (mode === "processing-transcription") return true;
  if (mode === "recording-audio" && !isActionModeRecording) return true;
  return false;
}

// Same pitfall as dictation: frontmost pid, window handle, and the text
// selection must all be captured synchronously before the pill paints.
function beginActionModeCapture(): void {
  const selectedText = getSelectedText();
  beginActionModeContext({
    targetPid: nativeInput.getFrontmostPid(),
    targetWindowHandle: nativeInput.getForegroundWindowHandle(),
    selectedText: selectedText && selectedText.trim().length > 0 ? selectedText : null,
    bundleId: getFocusedAppContext()?.bundleId ?? null,
  });
}

function toggleActionMode(): void {
  if (shouldIgnoreActionModeShortcut()) return;
  if (isRecording) return;

  if (!isActionModeRecording) {
    beginActionModeCapture();
    isActionModeRecording = true;
    onActionModeStart?.();
  } else {
    broadcastRecordingStop();
    // Note: isActionModeRecording is cleared by the action-mode IPC lifecycle.
  }
}

/**
 * Trigger the same recording toggle that the global shortcut uses.
 * Used by UI buttons (e.g. "Gravar agora") to start/stop recording.
 */
export function triggerRecordingToggle(): void {
  toggleRecording();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handlePasteLastTranscript(): Promise<void> {
  if (areGlobalShortcutsBlocked()) return;

  const text = getLastTranscriptText();
  if (!text) return;

  if (!checkAccessibility(false)) {
    clipboard.writeText(text);
    return;
  }

  // Wait for modifier keys (⌥⌘) to be released before simulating paste
  await sleep(100);

  // macOS: in-process Cmd+V (native typeText) is unreliable for GPU editors
  // like Zed when no target app is activated. Paste out-of-process via
  // System Events instead — pasteViaClipboard handles clipboard save/restore
  // and leaves the text on the clipboard if the keystroke never lands.
  if (nativeInput.isMacOS()) {
    await pasteViaClipboard(text);
    return;
  }

  const result = await insertTextAtCursor(text);
  if (result !== "Pasted") {
    clipboard.writeText(text);
  }
}

function triggerViewLastDiff(): void {
  if (areGlobalShortcutsBlocked()) return;
  // The pill window is hidden while idle; show it so the diff panel is visible.
  showPillWindow();
  sendPillViewLastDiff();
}

/**
 * Register a single global shortcut. Returns true on success.
 */
function registerShortcut(accelerator: string, callback: () => void): boolean {
  const success = globalShortcut.register(accelerator, callback);
  if (!success) {
    console.error(`[HotkeyService] Failed to register shortcut: ${accelerator}`);
  }
  return success;
}

type ShortcutKey = "transcription" | "pasteLastTranscript" | "viewLastDiff" | "actionMode";

function getCallbackForKey(key: ShortcutKey): () => void {
  if (key === "transcription") return toggleRecording;
  if (key === "viewLastDiff") return triggerViewLastDiff;
  if (key === "actionMode") return toggleActionMode;
  return () => void handlePasteLastTranscript();
}

export function registerCancelShortcut(): void {
  const accelerator = getShortcuts().cancelRecording;
  const success = globalShortcut.register(accelerator, () => {
    showPillWindow();
    sendPillCancelShortcut();
  });
  if (success) {
    cancelShortcutAccelerator = accelerator;
  } else {
    console.error(`[HotkeyService] Failed to register cancel shortcut: ${accelerator}`);
  }
}

export function unregisterCancelShortcut(): void {
  if (cancelShortcutAccelerator) {
    globalShortcut.unregister(cancelShortcutAccelerator);
    cancelShortcutAccelerator = null;
  }
}

const registeredSkillShortcuts = new Map<string, string>();

function registerSkillShortcut(skillId: string, accelerator: string): boolean {
  return registerShortcut(accelerator, () => {
    if (areGlobalShortcutsBlocked()) return;
    void applySkillToSelection(skillId);
  });
}

export function setupSkillShortcuts(): void {
  const { shortcuts } = getConfig().skills;
  registeredSkillShortcuts.clear();
  for (const [skillId, accelerator] of Object.entries(shortcuts)) {
    if (registerSkillShortcut(skillId, accelerator)) {
      registeredSkillShortcuts.set(skillId, accelerator);
    }
  }
}

function unregisterPreviousSkillShortcut(skillId: string): string | undefined {
  const previous = registeredSkillShortcuts.get(skillId);
  if (previous && globalShortcut.isRegistered(previous)) {
    globalShortcut.unregister(previous);
  }
  registeredSkillShortcuts.delete(skillId);
  return previous;
}

function isAcceleratorTakenByOtherSkill(
  shortcuts: Record<string, string>,
  skillId: string,
  accelerator: string
): boolean {
  for (const [otherId, otherAccel] of Object.entries(shortcuts)) {
    if (otherId !== skillId && otherAccel === accelerator) return true;
  }
  return false;
}

function isAcceleratorTakenByBuiltIn(accelerator: string): boolean {
  return Object.values(getShortcuts()).includes(accelerator);
}

function rollbackSkillShortcut(skillId: string, previous: string | undefined): void {
  if (previous) registerSkillShortcut(skillId, previous);
}

export function setSkillShortcut(
  skillId: string,
  accelerator: string | null
): { success: boolean; error?: string } {
  const previous = unregisterPreviousSkillShortcut(skillId);
  const nextShortcuts = { ...getConfig().skills.shortcuts };

  if (accelerator === null) {
    delete nextShortcuts[skillId];
    setSkillShortcuts(nextShortcuts);
    return { success: true };
  }

  if (
    isAcceleratorTakenByBuiltIn(accelerator) ||
    isAcceleratorTakenByOtherSkill(nextShortcuts, skillId, accelerator)
  ) {
    rollbackSkillShortcut(skillId, previous);
    return { success: false, error: m.notice_shortcut_in_use() };
  }

  if (!registerSkillShortcut(skillId, accelerator)) {
    rollbackSkillShortcut(skillId, previous);
    return { success: false, error: m.notice_shortcut_in_use() };
  }

  registeredSkillShortcuts.set(skillId, accelerator);
  nextShortcuts[skillId] = accelerator;
  setSkillShortcuts(nextShortcuts);
  return { success: true };
}

export function setupGlobalShortcuts(): void {
  const shortcuts = getShortcuts();
  registerShortcut(shortcuts.transcription, toggleRecording);
  registerShortcut(shortcuts.pasteLastTranscript, () => void handlePasteLastTranscript());
  registerShortcut(shortcuts.viewLastDiff, triggerViewLastDiff);
  registerShortcut(shortcuts.actionMode, toggleActionMode);
  setupSkillShortcuts();
}

/**
 * Update a shortcut dynamically. Unregisters the old accelerator,
 * registers the new one, and persists to disk. Rolls back on failure.
 */
export function updateShortcut(
  key: ShortcutKey,
  newAccelerator: string
): { success: boolean; error?: string } {
  const shortcuts = getShortcuts();
  const oldAccelerator = shortcuts[key];
  const callback = getCallbackForKey(key);

  // Unregister old shortcut
  if (globalShortcut.isRegistered(oldAccelerator)) {
    globalShortcut.unregister(oldAccelerator);
  }

  // Try to register new shortcut
  const success = registerShortcut(newAccelerator, callback);

  if (success) {
    setShortcut(key, newAccelerator);
    return { success: true };
  }

  // Rollback: re-register old shortcut
  registerShortcut(oldAccelerator, callback);
  return { success: false, error: m.notice_shortcut_in_use() };
}

export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll();
}
