import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// Chromium-family browsers expose the active tab via the same AppleScript dialect.
const CHROMIUM_BUNDLE_IDS = new Set([
  "com.google.Chrome",
  "com.google.Chrome.beta",
  "com.google.Chrome.dev",
  "com.google.Chrome.canary",
  "com.brave.Browser",
  "com.brave.Browser.beta",
  "com.brave.Browser.nightly",
  "com.microsoft.edgemac",
  "com.microsoft.edgemac.Beta",
  "company.thebrowser.Browser",
  "com.operasoftware.Opera",
  "com.vivaldi.Vivaldi",
  "org.chromium.Chromium",
]);

const SAFARI_BUNDLE_IDS = new Set(["com.apple.Safari", "com.apple.SafariTechnologyPreview"]);

function scriptForBundle(bundleId: string): string | null {
  if (CHROMIUM_BUNDLE_IDS.has(bundleId)) {
    return `tell application id "${bundleId}" to return URL of active tab of front window`;
  }
  if (SAFARI_BUNDLE_IDS.has(bundleId)) {
    return `tell application id "${bundleId}" to return URL of front document`;
  }
  return null;
}

function hostFromUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.hostname.replace(/^www\./, "").toLowerCase() || null;
  } catch {
    return null;
  }
}

/**
 * Resolve the host of the active browser tab for the focused app, so the worker can
 * pick a site-appropriate formatting overlay (e.g. mail.google.com -> email). macOS only
 * via AppleScript; other platforms and non-browser apps yield null. The bundleId is only
 * ever interpolated after matching a fixed allow-list, so no shell/script injection.
 */
export async function resolveActiveTabHost(bundleId: string | null): Promise<string | null> {
  if (process.platform !== "darwin" || !bundleId) return null;
  const script = scriptForBundle(bundleId);
  if (!script) return null;
  try {
    const { stdout } = await execFileAsync("osascript", ["-e", script], { timeout: 1000 });
    return hostFromUrl(stdout);
  } catch {
    return null;
  }
}
