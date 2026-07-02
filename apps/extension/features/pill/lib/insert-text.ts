import { restoreTarget } from "~/features/pill/lib/restore-target";

export type CapturedTarget = {
  element: HTMLElement;
  range: Range | null;
  selectionStart: number | null;
  selectionEnd: number | null;
};

export type InsertResult =
  | { ok: true; method: "execCommand" | "nativeSetter" }
  | { ok: false; reason: "fallback-clipboard"; clipboardOk: boolean };

const TIER1_WATCHDOG_MS = 50;

function waitForInputEvent(el: HTMLElement): {
  promise: Promise<boolean>;
  cleanup: () => void;
} {
  let listener: ((e: Event) => void) | null = null;
  const promise = new Promise<boolean>((resolve) => {
    listener = () => resolve(true);
    el.addEventListener("input", listener, { once: true });
  });
  const cleanup = () => {
    if (listener) el.removeEventListener("input", listener);
  };
  return { promise, cleanup };
}

function sleep(ms: number): Promise<false> {
  return new Promise((resolve) => setTimeout(() => resolve(false), ms));
}

async function tryExecCommand(text: string, el: HTMLElement): Promise<boolean> {
  const watch = waitForInputEvent(el);
  try {
    const supported = document.execCommand("insertText", false, text);
    const fired = await Promise.race([watch.promise, sleep(TIER1_WATCHDOG_MS)]);
    return supported && fired;
  } finally {
    watch.cleanup();
  }
}

function getNativeValueSetter(
  el: HTMLInputElement | HTMLTextAreaElement
): ((v: string) => void) | null {
  const proto =
    el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, "value");
  if (!desc?.set) return null;
  return desc.set.bind(el);
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function tryNativeSetter(
  text: string,
  el: HTMLInputElement | HTMLTextAreaElement,
  target: CapturedTarget
): Promise<boolean> {
  const setter = getNativeValueSetter(el);
  if (!setter) return false;
  const start = target.selectionStart ?? el.value.length;
  const end = target.selectionEnd ?? start;
  const current = el.value;
  const newValue = current.slice(0, start) + text + current.slice(end);
  setter(newValue);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  const caret = start + text.length;
  try {
    el.setSelectionRange(caret, caret);
  } catch {
    /* ignore */
  }
  await nextFrame();
  return el.value === newValue;
}

async function tryClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function tier3(text: string): Promise<InsertResult> {
  const clipboardOk = await tryClipboard(text);
  return { ok: false, reason: "fallback-clipboard", clipboardOk };
}

function isNativeFormControl(el: HTMLElement): el is HTMLInputElement | HTMLTextAreaElement {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

async function tryAllTiers(text: string, target: CapturedTarget): Promise<InsertResult | null> {
  const el = target.element;
  if (await tryExecCommand(text, el)) return { ok: true, method: "execCommand" };
  if (isNativeFormControl(el) && (await tryNativeSetter(text, el, target))) {
    return { ok: true, method: "nativeSetter" };
  }
  return null;
}

export async function insertText(
  text: string,
  target: CapturedTarget | null
): Promise<InsertResult> {
  if (!target) return tier3(text);

  const restored = restoreTarget(target);
  if (!restored) return tier3(text);

  const result = await tryAllTiers(text, target);
  if (result) return result;

  return tier3(text);
}
