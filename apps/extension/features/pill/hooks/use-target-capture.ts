import { useEffect } from "react";
import type { CapturedTarget } from "~/features/pill/lib/insert-text";

let capturedTarget: CapturedTarget | null = null;

function isShadowHostInPath(event: Event): boolean {
  const path = event.composedPath();
  for (const node of path) {
    if (node instanceof HTMLElement && node.dataset["shadowWhisperHost"] === "true") return true;
    if (node instanceof Element && node.tagName.toLowerCase().includes("shadow-whisper")) {
      return true;
    }
  }
  return false;
}

function snapshotInput(el: HTMLInputElement | HTMLTextAreaElement): CapturedTarget {
  return {
    element: el,
    range: null,
    selectionStart: el.selectionStart,
    selectionEnd: el.selectionEnd,
  };
}

function snapshotContentEditable(el: HTMLElement): CapturedTarget {
  const sel = window.getSelection();
  const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
  return { element: el, range, selectionStart: null, selectionEnd: null };
}

function snapshotFromActiveElement(): CapturedTarget | null {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el.tagName === "BODY") return null;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return snapshotInput(el);
  }
  if (el.isContentEditable) return snapshotContentEditable(el);
  return null;
}

function refreshSnapshot(event: Event): void {
  if (isShadowHostInPath(event)) return;
  capturedTarget = snapshotFromActiveElement();
}

export function getCapturedTarget(): CapturedTarget | null {
  return capturedTarget;
}

let installed = false;

export function installTargetCapture(): void {
  if (installed) return;
  installed = true;
  document.addEventListener("pointerdown", refreshSnapshot, { capture: true });
  document.addEventListener("focusin", refreshSnapshot, { capture: true });
}

export function useTargetCapture(): void {
  useEffect(() => {
    installTargetCapture();
  }, []);
}
