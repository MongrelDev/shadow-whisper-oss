"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_RECORDING_MS = 5 * 60 * 1000;
const AUDIO_LEVEL_THROTTLE_MS = 33;
const AUDIO_BITS_PER_SECOND = 32_000;

export type GuestRecorderStatus = "idle" | "requesting" | "recording" | "stopping" | "error";

const BUSY_STATUSES = new Set<GuestRecorderStatus>(["recording", "requesting", "stopping"]);

export interface UseGuestRecorderResult {
  status: GuestRecorderStatus;
  elapsedMs: number;
  audioLevel: number;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
  reset: () => void;
  analyserNode: AnalyserNode | null;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return "audio/webm";
  }
  return "";
}

function computeRms(buf: Uint8Array): number {
  let sumSquares = 0;
  for (let i = 0; i < buf.length; i++) {
    const normalized = (buf[i]! - 128) / 128;
    sumSquares += normalized * normalized;
  }
  return Math.sqrt(sumSquares / buf.length);
}

function buildAnalyser(stream: MediaStream): {
  ctx: AudioContext;
  analyser: AnalyserNode;
} | null {
  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    const ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    return { ctx, analyser };
  } catch {
    return null;
  }
}

function friendlyMicError(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError" || err.name === "SecurityError") {
      return "microphone_permission_denied";
    }
    if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
      return "microphone_not_found";
    }
  }
  return "microphone_unavailable";
}

export function useGuestRecorder(): UseGuestRecorderResult {
  const [status, setStatus] = useState<GuestRecorderStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopResolverRef = useRef<((blob: Blob | null) => void) | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastLevelEmitRef = useRef<number>(0);

  const stopTimers = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (autoStopTimerRef.current !== null) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (elapsedTimerRef.current !== null) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // already stopped
      }
    });
    streamRef.current = null;
  }, []);

  const closeAudio = useCallback(() => {
    const ctx = audioContextRef.current;
    if (ctx && ctx.state !== "closed") {
      ctx.close().catch(() => undefined);
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    setAnalyserNode(null);
  }, []);

  const teardown = useCallback(() => {
    stopTimers();
    releaseStream();
    closeAudio();
    recorderRef.current = null;
  }, [stopTimers, releaseStream, closeAudio]);

  useEffect(() => {
    return () => {
      teardown();
      stopResolverRef.current?.(null);
      stopResolverRef.current = null;
    };
  }, [teardown]);

  const stop = useCallback(async (): Promise<Blob | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      teardown();
      setStatus((prev) => (prev === "error" ? prev : "idle"));
      return null;
    }

    setStatus("stopping");

    return new Promise<Blob | null>((resolve) => {
      stopResolverRef.current = resolve;
      try {
        recorder.stop();
      } catch {
        stopResolverRef.current = null;
        teardown();
        setStatus("idle");
        resolve(null);
      }
    });
  }, [teardown]);

  const runAnalyserLoop = useCallback(() => {
    const tick = () => {
      const analyser = analyserRef.current;
      if (!analyser) {
        rafRef.current = null;
        return;
      }

      const buf = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(buf);
      const rms = computeRms(buf);

      const now = performance.now();
      if (now - lastLevelEmitRef.current >= AUDIO_LEVEL_THROTTLE_MS) {
        lastLevelEmitRef.current = now;
        setAudioLevel(Math.min(1, rms * 2));
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const wireRecorder = useCallback(
    (recorder: MediaRecorder, mimeType: string) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = chunksRef.current.length ? new Blob(chunksRef.current, { type }) : null;
        chunksRef.current = [];
        const resolver = stopResolverRef.current;
        stopResolverRef.current = null;
        teardown();
        setStatus("idle");
        resolver?.(blob);
      };

      recorder.onerror = () => {
        setError("recorder_error");
        const resolver = stopResolverRef.current;
        stopResolverRef.current = null;
        teardown();
        setStatus("error");
        resolver?.(null);
      };
    },
    [teardown]
  );

  const startTimers = useCallback(() => {
    startedAtRef.current = performance.now();
    elapsedTimerRef.current = setInterval(() => {
      setElapsedMs(Math.min(MAX_RECORDING_MS, performance.now() - startedAtRef.current));
    }, 100);
    autoStopTimerRef.current = setTimeout(() => {
      void stop();
    }, MAX_RECORDING_MS);
  }, [stop]);

  const acquireStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      return stream;
    } catch (err) {
      setError(friendlyMicError(err));
      setStatus("error");
      return null;
    }
  }, []);

  const setupAnalyser = useCallback((stream: MediaStream) => {
    const audio = buildAnalyser(stream);
    if (!audio) return;
    audioContextRef.current = audio.ctx;
    analyserRef.current = audio.analyser;
    setAnalyserNode(audio.analyser);
  }, []);

  const startMediaRecorder = useCallback(
    (stream: MediaStream): boolean => {
      const mimeType = pickMimeType();
      let recorder: MediaRecorder;
      try {
        recorder = mimeType
          ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: AUDIO_BITS_PER_SECOND })
          : new MediaRecorder(stream, { audioBitsPerSecond: AUDIO_BITS_PER_SECOND });
      } catch {
        setError("recorder_unsupported");
        setStatus("error");
        teardown();
        return false;
      }

      recorderRef.current = recorder;
      wireRecorder(recorder, mimeType);

      try {
        recorder.start();
        return true;
      } catch {
        setError("recorder_start_failed");
        setStatus("error");
        teardown();
        return false;
      }
    },
    [teardown, wireRecorder]
  );

  const start = useCallback(async (): Promise<void> => {
    if (BUSY_STATUSES.has(status)) return;

    setError(null);
    setElapsedMs(0);
    setAudioLevel(0);
    chunksRef.current = [];
    setStatus("requesting");

    const stream = await acquireStream();
    if (!stream) return;

    setupAnalyser(stream);

    if (!startMediaRecorder(stream)) return;

    startTimers();
    setStatus("recording");
    if (analyserRef.current) runAnalyserLoop();
  }, [acquireStream, runAnalyserLoop, setupAnalyser, startMediaRecorder, startTimers, status]);

  const reset = useCallback(() => {
    setError(null);
    setElapsedMs(0);
    setAudioLevel(0);
    if (status === "recording" || status === "stopping") {
      void stop();
    }
    setStatus("idle");
  }, [status, stop]);

  return {
    status,
    elapsedMs,
    audioLevel,
    error,
    start,
    stop,
    reset,
    analyserNode,
  };
}
