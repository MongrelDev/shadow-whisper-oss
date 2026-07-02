import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

let didMuteForRecording = false;
let previousMutedState: boolean | null = null;

async function runAppleScript(script: string): Promise<string> {
  const { stdout } = await execFileAsync("osascript", ["-e", script]);
  return stdout.trim();
}

async function getOutputMuted(): Promise<boolean> {
  const value = await runAppleScript("output muted of (get volume settings)");
  return value === "true";
}

async function setOutputMuted(muted: boolean): Promise<void> {
  await runAppleScript(`set volume output muted ${muted ? "true" : "false"}`);
}

export async function muteOtherAudioForRecording(enabled: boolean): Promise<void> {
  if (!enabled || process.platform !== "darwin" || didMuteForRecording) return;

  previousMutedState = await getOutputMuted();
  await setOutputMuted(true);
  didMuteForRecording = true;
}

export async function restoreOtherAudioAfterRecording(): Promise<void> {
  if (process.platform !== "darwin" || !didMuteForRecording) return;

  try {
    if (previousMutedState === false) {
      await setOutputMuted(false);
    }
  } finally {
    didMuteForRecording = false;
    previousMutedState = null;
  }
}
