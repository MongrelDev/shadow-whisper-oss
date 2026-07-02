export interface RecordingContext {
  sessionId: string | null;
  targetPid: number | null;
  targetWindowHandle: number | null;
}

let current: RecordingContext | null = null;

export function beginRecordingContext(
  targetPid: number | null,
  targetWindowHandle: number | null = null
): RecordingContext {
  current = { sessionId: null, targetPid, targetWindowHandle };
  return current;
}

export function setRecordingSessionId(sessionId: string): void {
  if (!current) return;
  current.sessionId = sessionId;
}

export function getRecordingContext(): RecordingContext | null {
  return current;
}

export function consumeRecordingContext(): RecordingContext | null {
  const ctx = current;
  current = null;
  return ctx;
}
