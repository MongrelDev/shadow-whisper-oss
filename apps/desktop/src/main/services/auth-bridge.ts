import { app, session } from "electron";

const WORKER_URL = __WORKER_URL__;

function workerOrigins(): { http: string; ws: string } {
  const httpOrigin = new URL(WORKER_URL).origin;
  const wsOrigin = httpOrigin.replace(/^http/, "ws");
  return { http: httpOrigin, ws: wsOrigin };
}

export function initAuthBridge(): void {
  void app.whenReady().then(() => {
    const { http, ws } = workerOrigins();
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...(details.responseHeaders ?? {}),
          "content-security-policy": `connect-src 'self' ${http} ${ws}`,
        },
      });
    });
  });
}
