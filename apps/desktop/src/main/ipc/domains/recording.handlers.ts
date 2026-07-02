import { ipcMain } from "electron";
import {
  setIsRecording,
  triggerRecordingToggle,
  unregisterCancelShortcut,
} from "../../services/HotkeyService";
import { getConfig } from "../../services/ConfigStore";
import {
  muteOtherAudioForRecording,
  restoreOtherAudioAfterRecording,
} from "../../services/AudioFocusService";
import {
  showPillWindow,
  hidePillWindow,
  setCelebrationActive,
  setPillIgnoreMouseEvents,
} from "../../windows/pill";

export function setupRecordingHandlers(): void {
  ipcMain.on("recording:started", () => {
    setIsRecording(true);
    void muteOtherAudioForRecording(getConfig().preferences.audio.shouldMuteAudio).catch(
      (error) => {
        console.warn("[RecordingHandlers] Failed to mute other audio", error);
      }
    );
  });

  ipcMain.on("recording:stopped", () => {
    unregisterCancelShortcut();
    setIsRecording(false);
    void restoreOtherAudioAfterRecording().catch((error) => {
      console.warn("[RecordingHandlers] Failed to restore other audio", error);
    });
  });

  ipcMain.on("recording:showWindow", () => {
    showPillWindow();
  });

  ipcMain.on("recording:hideWindow", () => {
    hidePillWindow();
  });

  ipcMain.on("recording:cancel", () => {
    unregisterCancelShortcut();
    setIsRecording(false);
    void restoreOtherAudioAfterRecording().catch((error) => {
      console.warn("[RecordingHandlers] Failed to restore other audio", error);
    });
    showPillWindow();
  });

  ipcMain.on("recording:setIgnoreMouseEvents", (_event, ignore: boolean) => {
    setPillIgnoreMouseEvents(ignore);
  });

  ipcMain.on("recording:toggle", () => {
    triggerRecordingToggle();
  });

  ipcMain.on("pill:celebration-done", () => {
    setCelebrationActive(false);
  });
}
