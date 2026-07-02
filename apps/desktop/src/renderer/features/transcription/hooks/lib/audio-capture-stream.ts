const DEFAULT_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
};

function buildAudioConstraints(deviceId?: string): MediaTrackConstraints {
  if (!deviceId) {
    return DEFAULT_AUDIO_CONSTRAINTS;
  }

  return {
    ...DEFAULT_AUDIO_CONSTRAINTS,
    deviceId: { exact: deviceId },
  };
}

export async function requestAudioStream(deviceId?: string): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: buildAudioConstraints(deviceId),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "OverconstrainedError" && deviceId) {
      console.warn("[useAudioCapture] deviceId constraint failed, falling back to default mic");

      return navigator.mediaDevices.getUserMedia({
        audio: DEFAULT_AUDIO_CONSTRAINTS,
      });
    }

    throw error;
  }
}

export function releaseAudioStream(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}
