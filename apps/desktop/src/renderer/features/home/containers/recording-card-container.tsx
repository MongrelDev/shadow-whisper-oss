import { useEffect, useState } from "react";
import { useConfig } from "@/hooks/use-config";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { useInteractionMode } from "@/providers/interaction-mode-provider";
import { m } from "~/paraglide/messages";
import { RecordingCard } from "../components/recording-card";

function stripParenSuffix(label: string): string {
  return label.replace(/\s*\([^)]*\)/g, "").trim();
}

async function fetchInputLabel(deviceId: string): Promise<string | null> {
  if (!navigator.mediaDevices?.enumerateDevices) return null;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const match = devices.find((d) => d.kind === "audioinput" && d.deviceId === deviceId);
    return match?.label ? stripParenSuffix(match.label) : null;
  } catch {
    return null;
  }
}

function useSelectedMicLabel(deviceId: string | false): string {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) {
      setLabel(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const next = await fetchInputLabel(deviceId);
      if (!cancelled) setLabel(next);
    };
    void load();
    navigator.mediaDevices?.addEventListener?.("devicechange", load);
    return () => {
      cancelled = true;
      navigator.mediaDevices?.removeEventListener?.("devicechange", load);
    };
  }, [deviceId]);

  if (!deviceId) return m.home_recording_card_mic_default();
  return label ?? m.home_recording_card_mic_default();
}

export function RecordingCardContainer(): React.ReactElement {
  const { config } = useConfig();
  const { shortcuts } = useShortcuts();
  const { mode } = useInteractionMode();
  const [localRecording, setLocalRecording] = useState(false);
  const isRecording = localRecording || mode === "recording-audio";

  useEffect(() => {
    const cleanupStart = window.api.recording.onStart(() => setLocalRecording(true));
    const cleanupStop = window.api.recording.onStop(() => setLocalRecording(false));
    const cleanupCancel = window.api.recording.onCancelShortcut(() => setLocalRecording(false));
    return () => {
      cleanupStart();
      cleanupStop();
      cleanupCancel();
    };
  }, []);

  const micLabel = useSelectedMicLabel(config.preferences.audio.inputDeviceId);

  const handleToggle = () => {
    window.api.recording.toggle();
  };

  return (
    <RecordingCard.Layout
      isRecording={isRecording}
      micLabel={micLabel}
      recordAccelerator={shortcuts?.transcription}
      onToggle={handleToggle}
    />
  );
}
