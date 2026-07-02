const WAVEFORM_HISTORY_LIMIT = 120;
const WAVEFORM_SAMPLE_INTERVAL_MS = 80;

export interface AudioLevelMonitorHandlers {
  onVolumeLevel: (level: number) => void;
  onWaveformSample: (sample: number) => void;
}

export interface AudioLevelMonitor {
  stop: () => void;
}

export function createAudioLevelMonitor(
  stream: MediaStream,
  handlers: AudioLevelMonitorHandlers
): AudioLevelMonitor | null {
  const AudioContextCtor = window.AudioContext;
  if (!AudioContextCtor) return null;

  const audioContext = new AudioContextCtor();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.85;
  source.connect(analyser);

  const data = new Float32Array(analyser.fftSize);
  let frameId: number | null = null;
  let lastHistoryUpdate = 0;
  let smoothedLevel = 0;

  const tick = () => {
    analyser.getFloatTimeDomainData(data);

    let sum = 0;
    for (let index = 0; index < data.length; index += 1) {
      const value = data[index] ?? 0;
      sum += value * value;
    }

    const rms = Math.sqrt(sum / data.length);
    const scaled = Math.min(1, rms * 10);
    smoothedLevel = smoothedLevel * 0.7 + scaled * 0.3;

    handlers.onVolumeLevel(smoothedLevel);

    const now = performance.now();
    if (now - lastHistoryUpdate >= WAVEFORM_SAMPLE_INTERVAL_MS) {
      lastHistoryUpdate = now;
      const normalized = Math.max(0.06, Math.min(1, 0.14 + smoothedLevel * 0.86));
      handlers.onWaveformSample(normalized);
    }

    frameId = requestAnimationFrame(tick);
  };

  frameId = requestAnimationFrame(tick);

  return {
    stop: () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }

      analyser.disconnect();
      source.disconnect();
      void audioContext.close().catch(() => undefined);
    },
  };
}

export { WAVEFORM_HISTORY_LIMIT };
