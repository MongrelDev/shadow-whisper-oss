import { getMainWindow } from "../windows/main";

type AuthDebugPayload = {
  event: string;
  details?: Record<string, unknown>;
  timestamp: string;
};

export function emitAuthDebug(event: string, details?: Record<string, unknown>): void {
  const payload: AuthDebugPayload = {
    event,
    details,
    timestamp: new Date().toISOString(),
  };

  console.info("[auth:debug]", payload);
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("auth:debug", payload);
  }
}
