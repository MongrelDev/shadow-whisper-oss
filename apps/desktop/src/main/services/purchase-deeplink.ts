import { app } from "electron";
import { getMainWindow, showMainWindow } from "../windows/main";

const PROTOCOL = "com.shadowwhisper.app:";
const PURCHASE_PATH = "/purchase/success";

export type PurchaseOrigin = "onboarding" | "billing" | "unknown";

export interface PurchasePayload {
  token: string | null;
  from: PurchaseOrigin;
}

function parsePurchaseUrl(raw: string): PurchasePayload | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== PROTOCOL) return null;
  // com.shadowwhisper.app://purchase/success → host="purchase", pathname="/success"
  const combined = `/${url.host}${url.pathname}`.replace(/\/+/g, "/");
  if (!combined.startsWith(PURCHASE_PATH)) return null;
  const token = url.searchParams.get("token");
  const fromRaw = url.searchParams.get("from");
  const from: PurchaseOrigin =
    fromRaw === "onboarding" || fromRaw === "billing" ? fromRaw : "unknown";
  return { token, from };
}

function dispatch(payload: PurchasePayload): void {
  showMainWindow();
  const win = getMainWindow();
  win?.webContents.send("purchase:deep-link", payload);
}

export function initPurchaseDeepLink(): void {
  app.on("open-url", (_event, url) => {
    const payload = parsePurchaseUrl(url);
    if (!payload) return;
    dispatch(payload);
  });

  app.on("second-instance", (_event, argv) => {
    const urlArg = argv.find((a) => a.startsWith(`${PROTOCOL}//`));
    if (!urlArg) return;
    const payload = parsePurchaseUrl(urlArg);
    if (payload) dispatch(payload);
  });
}
