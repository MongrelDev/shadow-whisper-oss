import type { OffscreenInboundMessage, OffscreenOutboundMessage } from "~/lib/messaging/types";

const MAX_DURATION_MS = 5 * 60 * 1000;
const AUDIO_BITS_PER_SECOND = 32_000;

let recorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let startedAt: number | null = null;
let stream: MediaStream | null = null;
let mime = "audio/webm";
let autoStopTimer: ReturnType<typeof setTimeout> | null = null;

function clearAutoStop() {
  if (autoStopTimer !== null) {
    clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }
}

function resetState() {
  recorder = null;
  chunks = [];
  startedAt = null;
  stream = null;
  clearAutoStop();
}

function sendToBackground(msg: OffscreenOutboundMessage) {
  chrome.runtime.sendMessage(msg);
}

function sendError(err: unknown) {
  sendToBackground({
    target: "background",
    type: "offscreen:error",
    code: err instanceof Error ? err.name : "UnknownError",
    message: err instanceof Error ? err.message : String(err),
  });
}

async function emitChunkReady(blob: Blob, mimeType: string, durationMs: number) {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = Array.from(new Uint8Array(arrayBuffer));
  sendToBackground({
    target: "background",
    type: "offscreen:chunk-ready",
    bytes,
    mimeType,
    durationMs,
  });
}

async function acquireStream(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });
  } catch (err) {
    if (err instanceof OverconstrainedError) {
      return navigator.mediaDevices.getUserMedia({ audio: true });
    }
    throw err;
  }
}

async function startRecording() {
  if (recorder || stream) return;
  try {
    stream = await acquireStream();
  } catch (err) {
    sendError(err);
    resetState();
    return;
  }

  startedAt = performance.now();

  mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";

  chunks = [];
  recorder = new MediaRecorder(stream, {
    mimeType: mime,
    audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
  });
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start();

  autoStopTimer = setTimeout(() => {
    if (isRecording()) {
      stopRecording().catch(sendError);
    }
  }, MAX_DURATION_MS);
}

function stopMediaRecorder(
  activeRecorder: MediaRecorder,
  activeStream: MediaStream,
  capturedStartedAt: number,
  capturedMime: string,
  capturedChunks: Blob[]
) {
  activeRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) capturedChunks.push(e.data);
  };

  activeRecorder.onstop = async () => {
    try {
      const blob = new Blob(capturedChunks, { type: capturedMime });
      const durationMs = performance.now() - capturedStartedAt;
      await emitChunkReady(blob, capturedMime, durationMs);
    } catch (err) {
      sendToBackground({
        target: "background",
        type: "offscreen:error",
        code: err instanceof Error ? err.name : "SerializationError",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      activeStream.getTracks().forEach((t) => t.stop());
    }
  };

  activeRecorder.stop();
}

async function stopRecording() {
  if (!recorder || !stream) {
    sendToBackground({
      target: "background",
      type: "offscreen:error",
      code: "NotRecording",
      message: "Stop called but no active recording",
    });
    return;
  }

  const capturedStartedAt = startedAt ?? performance.now();
  const capturedRecorder = recorder;
  const capturedStream = stream;
  const capturedMime = mime;
  const capturedChunks = chunks;

  resetState();

  stopMediaRecorder(
    capturedRecorder,
    capturedStream,
    capturedStartedAt,
    capturedMime,
    capturedChunks
  );
}

function isRecording(): boolean {
  return recorder?.state === "recording";
}

chrome.runtime.onMessage.addListener((msg: unknown) => {
  const message = msg as OffscreenInboundMessage & { target?: string };

  if (message.target !== "offscreen") return;

  if (message.type === "offscreen:get-status") {
    sendToBackground({
      target: "background",
      type: "offscreen:status-response",
      recording: isRecording(),
    });
    return;
  }

  if (message.type === "offscreen:start") {
    startRecording().catch((err) => {
      sendError(err);
      resetState();
    });
  } else if (message.type === "offscreen:stop") {
    stopRecording().catch((err) => {
      sendError(err);
    });
  }
});
