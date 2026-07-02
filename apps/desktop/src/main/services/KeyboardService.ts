import * as nativeInput from "@whisper/native-input";
import type { FocusedAppContext, InsertionResult } from "@whisper/native-input";

export type { InsertionResult };

export async function insertTextAtCursor(
  text: string,
  options: { targetPid?: number | null; targetWindowHandle?: number | null } = {}
): Promise<InsertionResult> {
  const result = await nativeInput.insertText(text, {
    targetPid: options.targetPid,
    targetWindowHandle: options.targetWindowHandle,
  });

  if (result === "Pasted") {
    console.log(
      "[KeyboardService] Text inserted at cursor:",
      text.substring(0, 50) + (text.length > 50 ? "..." : "")
    );
  }

  return result;
}

export function hasFocusedTextField(): boolean {
  if (!nativeInput.isAvailable()) return false;
  return nativeInput.hasFocusedTextField();
}

export function getSelectedText(): string | null {
  if (!nativeInput.isAvailable()) return null;
  return nativeInput.getSelectedText();
}

export function getFocusedAppContext(): FocusedAppContext | null {
  if (!nativeInput.isAvailable()) return null;
  return nativeInput.getFocusedAppContext();
}

export function checkAccessibility(promptIfNeeded = false): boolean {
  if (!nativeInput.isAvailable()) {
    return false;
  }

  return nativeInput.checkAccessibility(promptIfNeeded);
}
