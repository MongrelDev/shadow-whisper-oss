declare global {
  interface NavigatorUABrandVersion {
    brand: string;
    version: string;
  }
  interface Navigator {
    userAgentData?: { brands: NavigatorUABrandVersion[] };
  }
}

export function detectBrowserBundleId(): string {
  const brands = navigator.userAgentData?.brands ?? [];
  const brandNames = new Set(brands.map((b) => b.brand));
  if (brandNames.has("Brave")) return "com.brave.Browser";
  if (brandNames.has("Microsoft Edge")) return "com.microsoft.Edge";
  if (brandNames.has("Google Chrome")) return "com.google.Chrome";
  return "browser";
}

export function getShortcutManagementUrl(): string {
  const bundleId = detectBrowserBundleId();
  if (bundleId === "com.brave.Browser") return "brave://extensions/shortcuts";
  if (bundleId === "com.microsoft.Edge") return "edge://extensions/shortcuts";
  return "chrome://extensions/shortcuts";
}
