import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import * as linux from "./linux.js";

interface NativeInputModule {
  typeText(text: string): boolean;
  checkAccessibility(promptIfNeeded?: boolean): boolean;
  hasFocusedTextField(): boolean;
  getSelectedText(): string | null;
  getSelectedTextViaClipboard(): string | null;
  getFocusedAppContext(): {
    bundleId?: string;
    accessibilityTrusted?: boolean;
  } | null;
  getFrontmostPid(): number | null;
  getFrontmostBundleId?(): string | null;
  getBundleIdForPid?(pid: number): string | null;
  activateApplicationByPid?(pid: number): boolean;
  enableAccessibilityForPid?(pid: number, mode: "manual" | "enhanced"): boolean;
  getFocusedFieldValueForPid?(pid: number): string | null;
  // Windows clipboard-based insertion primitives
  getForegroundWindowHandle?(): number | null;
  activateWindow?(hwnd: number): boolean;
  isAnyModifierKeyDown?(): boolean;
  snapshotClipboard?(): string | null;
  writeClipboard?(text: string): boolean;
  restoreClipboard?(text: string | null): boolean;
  sendPasteInput?(): number;
  sendShiftInsertInput?(): number;
  getWindowProcessName?(hwnd: number): string | null;
  sendCopyInput?(): number;
}

export interface FocusedAppContext {
  bundleId: string;
  accessibilityTrusted: boolean;
}

export type InsertionResult = "Pasted" | "CopiedToClipboard" | "NoText" | "Failed";

export interface InsertionOptions {
  targetWindowHandle?: number | null;
  targetPid?: number | null;
}

let native: NativeInputModule | null = null;
let loadError: Error | null = null;

const isMac = process.platform === "darwin";
const isWindows = process.platform === "win32";
const isLinux = process.platform === "linux";
const isSupported = isMac || isWindows || isLinux;

if (isLinux) {
  try {
    native = linux.createLinuxModule();
  } catch (error) {
    loadError = error instanceof Error ? error : new Error(String(error));
    console.warn("@whisper/native-input: Failed to initialize Linux module:", error);
  }
} else if (isSupported) {
  try {
    const require = createRequire(import.meta.url);
    const __dirname = dirname(fileURLToPath(import.meta.url));
    native = require(join(__dirname, "../build/Release/native_input.node"));
  } catch (error) {
    loadError = error instanceof Error ? error : new Error(String(error));
    console.warn("@whisper/native-input: Failed to load native module:", error);
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function ensureNative(): NativeInputModule {
  if (native) return native;
  if (loadError) {
    throw new Error(`Native module failed to load: ${loadError.message}`);
  }
  throw new Error(
    `Platform not supported: ${process.platform}. Only macOS, Windows, and Linux are supported.`
  );
}

// ---------------------------------------------------------------------------
// Windows insertion helpers
// ---------------------------------------------------------------------------

const MODIFIER_POLL_MS = 25;
const MODIFIER_MAX_CHECKS = 32;
const FOCUS_DELAY_MS = 100;
const CLIPBOARD_RESTORE_DELAY_MS = 200;
const EXPECTED_PASTE_EVENTS = 4;

function isModifierHeld(): boolean {
  return native?.isAnyModifierKeyDown?.() === true;
}

async function waitForModifierRelease(): Promise<boolean> {
  for (let i = 0; i < MODIFIER_MAX_CHECKS; i++) {
    if (!isModifierHeld()) return true;
    await sleep(MODIFIER_POLL_MS);
  }
  return !isModifierHeld();
}

function isForegroundWindow(hwnd: number): boolean {
  return native?.getForegroundWindowHandle?.() === hwnd;
}

async function focusTargetWindow(hwnd: number | null | undefined): Promise<boolean> {
  if (!hwnd) {
    await sleep(FOCUS_DELAY_MS);
    return true;
  }
  if (!isForegroundWindow(hwnd)) {
    native?.activateWindow?.(hwnd);
  }
  await sleep(FOCUS_DELAY_MS);
  return isForegroundWindow(hwnd);
}

function snapshotAndWrite(text: string): { previousClipboard: string | null } | null {
  const previousClipboard = native!.snapshotClipboard?.() ?? null;
  const written = native!.writeClipboard?.(text);
  if (!written) {
    native!.restoreClipboard?.(previousClipboard);
    return null;
  }
  return { previousClipboard };
}

function restoreAfterPaste(previousClipboard: string | null, delayMs: number): Promise<void> {
  return sleep(delayMs).then(() => {
    native!.restoreClipboard?.(previousClipboard);
  });
}

// Ctrl+V is not a paste shortcut in classic consoles, PuTTY, or mintty, and is
// configurable in Windows Terminal — Shift+Insert pastes in all of them. Process
// names are matched lowercase without the .exe suffix (the native side strips it).
const WINDOWS_TERMINAL_PROCESSES = new Set([
  "windowsterminal",
  "openconsole",
  "conhost",
  "cmd",
  "powershell",
  "pwsh",
  "putty",
  "kitty", // PuTTY fork
  "mintty",
  "alacritty",
  "wezterm-gui",
  "hyper",
  "tabby",
  "warp",
  "ubuntu",
  "wsl",
]);

function windowProcessName(hwnd: number): string | null {
  return native?.getWindowProcessName?.(hwnd) ?? null;
}

function isWindowsTerminalTarget(targetHwnd: number | null | undefined): boolean {
  const hwnd = targetHwnd ?? getForegroundWindowHandle();
  const processName = hwnd ? windowProcessName(hwnd) : null;
  return processName !== null && WINDOWS_TERMINAL_PROCESSES.has(processName.toLowerCase());
}

function sendPasteEvents(isTerminal: boolean): number {
  const send = (isTerminal ? native?.sendShiftInsertInput : null) ?? native?.sendPasteInput;
  return send ? send() : 0;
}

function trySendWindowsPaste(isTerminal: boolean): boolean {
  return sendPasteEvents(isTerminal) === EXPECTED_PASTE_EVENTS;
}

async function insertTextWindowsPaste(
  text: string,
  targetHwnd: number | null | undefined
): Promise<InsertionResult> {
  const isTerminal = isWindowsTerminalTarget(targetHwnd);
  const snap = snapshotAndWrite(text);
  if (!snap) return "Failed";

  if (!(await waitForModifierRelease())) return "CopiedToClipboard";
  if (!(await focusTargetWindow(targetHwnd))) return "CopiedToClipboard";
  if (!trySendWindowsPaste(isTerminal)) return "CopiedToClipboard";

  await restoreAfterPaste(snap.previousClipboard, CLIPBOARD_RESTORE_DELAY_MS);
  return "Pasted";
}

// ---------------------------------------------------------------------------
// Linux insertion helpers
// ---------------------------------------------------------------------------

const LINUX_PASTE_DELAY_MS = 50;
const LINUX_MODIFIER_SETTLE_MS = 150;

async function insertTextLinuxPaste(text: string): Promise<InsertionResult> {
  const windowClass = linux.getActiveWindowClass();
  const snap = snapshotAndWrite(text);
  if (!snap) return "Failed";

  // Wait for modifier keys to be released (user may still hold the recording hotkey)
  await sleep(LINUX_MODIFIER_SETTLE_MS);
  await sleep(LINUX_PASTE_DELAY_MS);

  const pasted = await linux.sendPasteKey(linux.isTerminalWindow(windowClass), windowClass);
  if (!pasted) return "CopiedToClipboard";

  await restoreAfterPaste(snap.previousClipboard, linux.getRestoreDelayMs());
  return "Pasted";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Low-level: type characters one by one via OS input simulation.
 * macOS: pasteboard + Cmd+V with CGEvent fallback.
 * Windows: SendInput with KEYEVENTF_UNICODE per character.
 * Prefer `insertText` for transcription insertion — it handles clipboard,
 * modifier wait, and target activation on all platforms.
 */
export function typeText(text: string): boolean {
  return ensureNative().typeText(text);
}

export function checkAccessibility(promptIfNeeded = false): boolean {
  if (!native) return false;
  return native.checkAccessibility(promptIfNeeded);
}

export function hasFocusedTextField(): boolean {
  if (!native) return false;
  return native.hasFocusedTextField();
}

export function getSelectedText(): string | null {
  if (!native) return null;

  const axResult = native.getSelectedText();
  if (typeof axResult === "string") return axResult;

  return native.getSelectedTextViaClipboard();
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

export function getFocusedAppContext(): FocusedAppContext | null {
  const context = native?.getFocusedAppContext?.();
  const bundleId = nonEmptyString(context?.bundleId);
  if (!context || !bundleId) return null;

  return {
    bundleId,
    accessibilityTrusted: context.accessibilityTrusted === true,
  };
}

export function getFrontmostPid(): number | null {
  if (!native) return null;
  return native.getFrontmostPid();
}

export function getFrontmostBundleId(): string | null {
  return native?.getFrontmostBundleId?.() ?? null;
}

export function getBundleIdForPid(pid: number): string | null {
  return native?.getBundleIdForPid?.(pid) ?? null;
}

export function activateApplicationByPid(pid: number): boolean {
  return native?.activateApplicationByPid?.(pid) ?? false;
}

export function enableAccessibilityForPid(pid: number, mode: "manual" | "enhanced"): boolean {
  return native?.enableAccessibilityForPid?.(pid, mode) ?? false;
}

export function getFocusedFieldValueForPid(pid: number): string | null {
  return native?.getFocusedFieldValueForPid?.(pid) ?? null;
}

export function isAvailable(): boolean {
  return native !== null;
}

export function isMacOS(): boolean {
  return isMac;
}

export function isWindowsOS(): boolean {
  return isWindows;
}

export function isLinuxOS(): boolean {
  return isLinux;
}

export function getLoadError(): Error | null {
  return loadError;
}

export function getForegroundWindowHandle(): number | null {
  if (!native?.getForegroundWindowHandle) return null;
  return native.getForegroundWindowHandle();
}

export function isAnyModifierKeyDown(): boolean {
  if (!native?.isAnyModifierKeyDown) return false;
  return native.isAnyModifierKeyDown();
}

/**
 * High-level: insert transcription text into the target app.
 * macOS: activates target by PID, delegates to typeText (pasteboard + Cmd+V).
 * Windows: clipboard snapshot → write → wait modifiers → activate HWND → Ctrl+V → restore.
 * Linux: clipboard snapshot → write → detect terminal → send paste key → restore.
 * Returns the outcome so callers can show appropriate feedback.
 */
async function insertTextMac(
  text: string,
  targetPid: number | null | undefined
): Promise<InsertionResult> {
  const n = ensureNative();
  if (targetPid) {
    n.activateApplicationByPid?.(targetPid);
    await sleep(50);
  }
  return n.typeText(text) ? "Pasted" : "CopiedToClipboard";
}

export async function insertText(
  text: string,
  options: InsertionOptions = {}
): Promise<InsertionResult> {
  if (!text) return "NoText";
  ensureNative();

  if (isMac) return insertTextMac(text, options.targetPid);
  if (isWindows) return insertTextWindowsPaste(text, options.targetWindowHandle);
  if (isLinux) return insertTextLinuxPaste(text);

  throw new Error(`Unsupported platform: ${process.platform}`);
}
