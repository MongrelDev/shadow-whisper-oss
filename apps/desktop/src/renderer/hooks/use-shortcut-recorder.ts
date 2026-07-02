import { useEffect, useRef, useState } from "react";
import { displayToAccelerator } from "@/lib/accelerator";
import { useInteractionMode } from "@/providers/interaction-mode-provider";

const SHORTCUT_RECORDER_OWNER = "shortcut-recorder";

export interface UseShortcutRecorderReturn {
  recording: boolean;
  currentKeys: string[]; // Display symbols shown during recording
  startRecording: () => void;
  cancelRecording: () => void;
}

interface UseShortcutRecorderOptions {
  onComplete: (accelerator: string) => void;
}

/**
 * Map e.code (physical key) to Electron accelerator key name.
 * e.key is unreliable on macOS — Option combos produce special chars (e.g., Option+Shift+R → ‰).
 * e.code always gives the physical key regardless of modifiers.
 */
function codeToKeyName(code: string): string | null {
  // Letters: KeyA → A, KeyZ → Z
  if (code.startsWith("Key")) return code.slice(3);
  // Digits: Digit0 → 0, Digit9 → 9
  if (code.startsWith("Digit")) return code.slice(5);
  // Function keys: F1-F24
  if (/^F\d{1,2}$/.test(code)) return code;
  // Named keys
  const named: Record<string, string> = {
    Space: "Space",
    Tab: "Tab",
    Enter: "Return",
    Backspace: "Backspace",
    Delete: "Delete",
    Insert: "Insert",
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    Home: "Home",
    End: "End",
    PageUp: "PageUp",
    PageDown: "PageDown",
    Escape: "Escape",
    Minus: "-",
    Equal: "=",
    BracketLeft: "[",
    BracketRight: "]",
    Backslash: "\\",
    Semicolon: ";",
    Quote: "'",
    Comma: ",",
    Period: ".",
    Slash: "/",
    Backquote: "`",
  };
  return named[code] ?? null;
}

function getDisplayKeys(event: KeyboardEvent): string[] {
  const keys: string[] = [];
  if (event.metaKey) keys.push("⌘");
  if (event.ctrlKey) keys.push("⌃");
  if (event.shiftKey) keys.push("⇧");
  if (event.altKey) keys.push("⌥");
  return keys;
}

function isModifierOnlyKey(code: string): boolean {
  return [
    "MetaLeft",
    "MetaRight",
    "ControlLeft",
    "ControlRight",
    "ShiftLeft",
    "ShiftRight",
    "AltLeft",
    "AltRight",
  ].includes(code);
}

function isEscapeWithoutModifiers(event: KeyboardEvent): boolean {
  return (
    event.code === "Escape" && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey
  );
}

/**
 * Hook for recording keyboard shortcuts with real-time display.
 * Captures modifier keys and waits for a non-modifier key to complete.
 * Requires at least one modifier key to be pressed.
 * Uses e.code (physical key) to avoid macOS Option key character mangling.
 */
export function useShortcutRecorder({
  onComplete,
}: UseShortcutRecorderOptions): UseShortcutRecorderReturn {
  const [recording, setRecording] = useState(false);
  const [currentKeys, setCurrentKeys] = useState<string[]>([]);
  const interactionMode = useInteractionMode();

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const startRecording = () => {
    void interactionMode.setMode("capturing-shortcut", SHORTCUT_RECORDER_OWNER);
    setRecording(true);
    setCurrentKeys([]);
  };

  const cancelRecording = () => {
    void interactionMode.clearMode(SHORTCUT_RECORDER_OWNER);
    setRecording(false);
    setCurrentKeys([]);
  };

  useEffect(() => {
    if (!recording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isEscapeWithoutModifiers(e)) {
        cancelRecording();
        return;
      }

      const keys = getDisplayKeys(e);

      if (!isModifierOnlyKey(e.code)) {
        if (keys.length === 0) return; // Require at least one modifier

        const keyName = codeToKeyName(e.code);
        if (!keyName) return; // Unrecognized key — ignore

        keys.push(keyName);

        void interactionMode.clearMode(SHORTCUT_RECORDER_OWNER);
        setRecording(false);
        setCurrentKeys([]);

        const accelerator = displayToAccelerator(keys);
        onCompleteRef.current(accelerator);
      } else {
        setCurrentKeys(keys);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      void interactionMode.clearMode(SHORTCUT_RECORDER_OWNER);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [interactionMode, recording]);

  return {
    recording,
    currentKeys,
    startRecording,
    cancelRecording,
  };
}
