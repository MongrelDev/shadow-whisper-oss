type NavigatorWithUAData = Navigator & {
  userAgentData?: { platform?: string };
};

export function isMac(): boolean {
  const nav = navigator as NavigatorWithUAData;
  const uaPlatform = nav.userAgentData?.platform;
  if (uaPlatform) return uaPlatform === "macOS";
  return navigator.platform.includes("Mac");
}

export function pasteShortcutLabel(): string {
  return isMac() ? "⌘V" : "Ctrl+V";
}
