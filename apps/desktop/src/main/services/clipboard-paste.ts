import { execFile } from "node:child_process";
import { clipboard } from "electron";
import type { InsertionResult } from "@whisper/native-input";

// Timings mirror OpenWhispr's macOS paste flow: a short settle before the
// synthetic Cmd+V, and a longer wait before restoring the user's clipboard so
// the target app has consumed the paste first.
const PRE_PASTE_DELAY_MS = 120;
const RESTORE_DELAY_MS = 450;
const RETRY_REWRITE_DELAY_MS = 200;
const OSASCRIPT_TIMEOUT_MS = 3000;

// key code 9 = "V"; modifier "command down" → Cmd+V. Posted out-of-process by
// System Events so the keystroke lands on the frontmost app instead of Shadow.
const PASTE_SCRIPT = 'tell application "System Events" to key code 9 using command down';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function runPasteKeystroke(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile("osascript", ["-e", PASTE_SCRIPT], { timeout: OSASCRIPT_TIMEOUT_MS }, (error) => {
      resolve(!error);
    });
  });
}

/**
 * Paste text into the frontmost app the way OpenWhispr does: write to the
 * clipboard, fire an out-of-process Cmd+V via System Events, then restore the
 * user's previous clipboard. In-process CGEvent Cmd+V (native typeText) is
 * unreliable for GPU editors like Zed; the osascript keystroke is not.
 *
 * Returns "Pasted" on success, "CopiedToClipboard" if the keystroke never
 * landed (text is left on the clipboard for a manual paste).
 */
export async function pasteViaClipboard(text: string): Promise<InsertionResult> {
  if (!text) return "NoText";

  const original = clipboard.readText();
  clipboard.writeText(text);
  await sleep(PRE_PASTE_DELAY_MS);

  let pasted = await runPasteKeystroke();
  if (!pasted) {
    clipboard.writeText(text);
    await sleep(RETRY_REWRITE_DELAY_MS);
    pasted = await runPasteKeystroke();
  }

  if (!pasted) {
    return "CopiedToClipboard";
  }

  void sleep(RESTORE_DELAY_MS).then(() => clipboard.writeText(original));
  return "Pasted";
}
