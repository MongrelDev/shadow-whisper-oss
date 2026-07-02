import { useCallback, useEffect, useRef, useState } from "react";
import { createAudioLevelMonitor, WAVEFORM_HISTORY_LIMIT } from "./lib/audio-level-monitor";
import { releaseAudioStream, requestAudioStream } from "./lib/audio-capture-stream";

export interface RecordingCompleteMeta {
  hadSpeechActivity: boolean;
}

export interface UseAudioCaptureOptions {
  onRecordingComplete?: (audioBlob: Blob, meta: RecordingCompleteMeta) => Promise<void> | void;
  onError?: (error: Error) => void;
  deviceId?: string;
}

export interface UseAudioCaptureReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  isRecording: boolean;
  isSpeaking: boolean;
  hadSpeechActivity: boolean;
  volumeLevel: number;
  waveformHistory: number[];
  error: Error | null;
}

const MAX_DURATION_MS = 5 * 60 * 1000;
const SPEAKING_THRESHOLD = 0.05;
// Opus is transparent for speech well below this; the browser default (~128kbps)
// quadruples the upload and the base64 payload sent to STT for zero accuracy gain.
const AUDIO_BITS_PER_SECOND = 32_000;

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  return "";
}

function appendWaveformSample(previous: number[], sample: number): number[] {
  return [...previous.slice(-(WAVEFORM_HISTORY_LIMIT - 1)), sample];
}

export function useAudioCapture({
  onRecordingComplete,
  onError,
  deviceId,
}: UseAudioCaptureOptions): UseAudioCaptureReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hadSpeechActivity, setHadSpeechActivity] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [waveformHistory, setWaveformHistory] = useState<number[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string>("");
  const monitorStopRef = useRef<(() => void) | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRecordingCompleteRef = useRef(onRecordingComplete);
  const onErrorRef = useRef(onError);

  onRecordingCompleteRef.current = onRecordingComplete;
  onErrorRef.current = onError;

  const resetMonitoringState = useCallback(() => {
    setIsSpeaking(false);
    setHadSpeechActivity(false);
    setVolumeLevel(0);
  }, []);

  const cleanupMonitoring = useCallback(() => {
    monitorStopRef.current?.();
    monitorStopRef.current = null;
    if (autoStopTimerRef.current !== null) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    resetMonitoringState();
  }, [resetMonitoringState]);

  const releaseStream = useCallback(() => {
    releaseAudioStream(streamRef.current);
    streamRef.current = null;
  }, []);

  const finalizeStop = useCallback(() => {
    setIsRecording(false);
    cleanupMonitoring();
    releaseStream();
    recorderRef.current = null;
    chunksRef.current = [];
  }, [cleanupMonitoring, releaseStream]);

  const fail = useCallback((captureError: Error) => {
    setError(captureError);
    onErrorRef.current?.(captureError);
  }, []);

  const stopRecording = useCallback(async (): Promise<void> => {
    const recorder = recorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      finalizeStop();
      return;
    }

    return new Promise<void>((resolve) => {
      const capturedChunks = chunksRef.current;
      const capturedMime = mimeRef.current;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) capturedChunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(capturedChunks, { type: capturedMime || "audio/webm" });
        finalizeStop();
        try {
          await onRecordingCompleteRef.current?.(blob, { hadSpeechActivity: true });
        } catch (completeError) {
          fail(
            completeError instanceof Error
              ? completeError
              : new Error("Failed to finalize recording")
          );
        }
        resolve();
      };

      recorder.stop();
    });
  }, [fail, finalizeStop]);

  const startLevelMonitoring = useCallback((stream: MediaStream) => {
    const monitor = createAudioLevelMonitor(stream, {
      onVolumeLevel: (level) => {
        setVolumeLevel(level);
        if (level > SPEAKING_THRESHOLD) {
          setIsSpeaking(true);
          setHadSpeechActivity(true);
        } else {
          setIsSpeaking(false);
        }
      },
      onWaveformSample: (sample) => {
        setWaveformHistory((previous) => appendWaveformSample(previous, sample));
      },
    });
    monitorStopRef.current = monitor?.stop ?? null;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setWaveformHistory([]);
      resetMonitoringState();
      chunksRef.current = [];

      const stream = await requestAudioStream(deviceId);
      streamRef.current = stream;

      const mimeType = pickMimeType();
      mimeRef.current = mimeType;
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: AUDIO_BITS_PER_SECOND })
        : new MediaRecorder(stream, { audioBitsPerSecond: AUDIO_BITS_PER_SECOND });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorderRef.current = recorder;
      recorder.start();

      startLevelMonitoring(stream);

      autoStopTimerRef.current = setTimeout(() => {
        void stopRecording();
      }, MAX_DURATION_MS);

      setIsRecording(true);
    } catch (errorValue) {
      const captureError =
        errorValue instanceof Error ? errorValue : new Error("Failed to start recording");
      finalizeStop();
      fail(captureError);
      throw captureError;
    }
  }, [deviceId, fail, finalizeStop, resetMonitoringState, startLevelMonitoring, stopRecording]);

  useEffect(() => {
    return () => {
      void stopRecording().catch(() => undefined);
    };
  }, [stopRecording]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    isSpeaking,
    hadSpeechActivity,
    volumeLevel,
    waveformHistory,
    error,
  };
}
