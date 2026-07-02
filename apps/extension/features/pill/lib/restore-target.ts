import type { CapturedTarget } from "~/features/pill/lib/insert-text";

function restoreInput(el: HTMLInputElement | HTMLTextAreaElement, target: CapturedTarget): boolean {
  el.focus({ preventScroll: true });
  try {
    el.setSelectionRange(target.selectionStart ?? 0, target.selectionEnd ?? 0);
  } catch {
    return false;
  }
  return document.activeElement === el;
}

function restoreContentEditable(el: HTMLElement, range: Range | null): boolean {
  el.focus({ preventScroll: true });
  if (range) {
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
  return document.activeElement === el || el.contains(document.activeElement);
}

export function restoreTarget(target: CapturedTarget | null): boolean {
  if (!target) return false;
  const el = target.element;

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return restoreInput(el, target);
  }

  if (el.isContentEditable) {
    return restoreContentEditable(el, target.range);
  }

  return false;
}
