export type InteractionMode =
  | "idle"
  | "capturing-shortcut"
  | "recording-audio"
  | "processing-transcription"
  | "running-transform";

type InteractionOwner = string;

let currentMode: InteractionMode = "idle";
let currentOwner: InteractionOwner | null = null;

export function getInteractionMode(): InteractionMode {
  return currentMode;
}

export function setInteractionMode(mode: InteractionMode, owner?: InteractionOwner): void {
  currentMode = mode;
  currentOwner = owner ?? null;
}

export function clearInteractionMode(owner?: InteractionOwner): void {
  if (owner && currentOwner && currentOwner !== owner) {
    return;
  }

  currentMode = "idle";
  currentOwner = null;
}

export function areGlobalShortcutsBlocked(): boolean {
  return currentMode === "capturing-shortcut";
}
