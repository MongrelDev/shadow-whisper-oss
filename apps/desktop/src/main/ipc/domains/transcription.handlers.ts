import { ipcMain, clipboard } from "electron";
import {
  insertTextAtCursor,
  checkAccessibility,
  hasFocusedTextField,
} from "../../services/KeyboardService";
import { setIsRecording } from "../../services/HotkeyService";
import { showPillWindow } from "../../windows/pill";
import { getShortcuts } from "../../services/ConfigStore";
import { getLastTranscriptText, setLastTranscriptText } from "../../services/last-transcript-store";
import { consumeRecordingContext, getRecordingContext } from "../../services/recording-context";
import { autoTeachCoordinator } from "../../feedback/auto-teach";
import { m } from "../../../renderer/paraglide/messages";

const MODIFIER_SYMBOLS: Record<string, string> = {
  CommandOrControl: "⌘",
  Command: "⌘",
  Alt: "⌥",
  Option: "⌥",
  Shift: "⇧",
  Control: "⌃",
};

function acceleratorToSymbols(accelerator: string): string {
  return accelerator
    .split("+")
    .map((p) => MODIFIER_SYMBOLS[p] ?? p.toUpperCase())
    .join("");
}

export { getLastTranscriptText };

const FOCUS_CHECK_RETRIES = 6;
const FOCUS_CHECK_DELAY_MS = 50;

function fallbackToClipboard(text: string, notice: string): { success: true; notice: string } {
  clipboard.writeText(text);
  showPillWindow();
  return { success: true, notice };
}

function textForInsertion(text: string): string {
  const lastChar = text.at(-1);
  if (!lastChar || /\s/u.test(lastChar)) return text;
  return `${text} `;
}

type AutoTeachReady = {
  ready: true;
  targetPid: number;
  sessionId: string;
};
type AutoTeachSkip = { ready: false; reason: string };

function resolveAutoTeach(
  ctx: ReturnType<typeof consumeRecordingContext>
): AutoTeachReady | AutoTeachSkip {
  if (!ctx) return { ready: false, reason: "no-context" };
  const targetPid = ctx.targetPid;
  if (targetPid === null || targetPid === -1) return { ready: false, reason: "no-targetPid" };
  if (!ctx.sessionId) return { ready: false, reason: "no-sessionId" };
  return { ready: true, targetPid, sessionId: ctx.sessionId };
}

function maybeStartAutoTeach(text: string): void {
  const ctx = consumeRecordingContext();
  const resolved = resolveAutoTeach(ctx);
  if (!resolved.ready) return;
  // TODO(Plan 06): source from local UserMemoryDO sync cache once it lands.
  // Until then, server-side defense in ingest-teach catches dict membership.
  autoTeachCoordinator.start({
    originalText: text,
    targetPid: resolved.targetPid,
    sessionId: resolved.sessionId,
    userDictionary: new Set<string>(),
  });
}

async function waitForFocusedTextField(): Promise<boolean> {
  for (let attempt = 0; attempt < FOCUS_CHECK_RETRIES; attempt += 1) {
    if (hasFocusedTextField()) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, FOCUS_CHECK_DELAY_MS));
  }

  return false;
}

function buildNoTextFieldNotice(): string {
  const pasteKey = getShortcuts().pasteLastTranscript;
  if (!pasteKey) return m.pill_feedback_no_text_field_reason();
  const hint = `${m.pill_feedback_no_text_field_hint_prefix()} ${acceleratorToSymbols(pasteKey)} ${m.pill_feedback_no_text_field_hint_paste()}`;
  return `${m.pill_feedback_no_text_field_reason()}\n${hint}`;
}

function handleInsertFailure(
  insertionText: string,
  hasFocusedField: boolean
): { success: true; notice: string } {
  if (hasFocusedField) {
    return fallbackToClipboard(insertionText, m.share_copied());
  }

  showPillWindow();
  return fallbackToClipboard(insertionText, buildNoTextFieldNotice());
}

function getInsertionTargets() {
  const ctx = getRecordingContext();
  return {
    targetPid: ctx?.targetPid ?? null,
    targetWindowHandle: ctx?.targetWindowHandle ?? null,
  };
}

async function handleTranscriptionInsert(text: string) {
  setLastTranscriptText(text);
  setIsRecording(false);
  const insertionText = textForInsertion(text);

  if (!checkAccessibility(false)) {
    return fallbackToClipboard(insertionText, m.notice_copied_accessibility_required());
  }

  let result: Awaited<ReturnType<typeof insertTextAtCursor>>;
  try {
    result = await insertTextAtCursor(insertionText, getInsertionTargets());
  } catch {
    return fallbackToClipboard(insertionText, m.share_copied());
  }

  if (result === "Pasted") {
    showPillWindow();
    maybeStartAutoTeach(text);
    return { success: true };
  }

  const hasFocusedField = await waitForFocusedTextField();
  return handleInsertFailure(insertionText, hasFocusedField);
}

export function setupTranscriptionHandlers(): void {
  ipcMain.on("transcription:seed-last", (_event, text: string) => {
    if (text) setLastTranscriptText(text);
  });

  ipcMain.handle("transcription:insert", (_event, text: string) => handleTranscriptionInsert(text));
}
