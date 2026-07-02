import type { AppRegistryCategory, AppRegistryPlatform } from "../schema/app-registry";

// Native applications. Identifier is the per-platform handle (macOS bundle id, Windows
// process name sans .exe, Linux window class). hostName is the display name.
export interface AppRegistrySeedRow {
  readonly platform: AppRegistryPlatform;
  readonly identifier: string;
  readonly hostName: string;
  readonly category: AppRegistryCategory;
}

// Websites. host is the domain; hostName is the display name. Platform-agnostic.
export interface AppHostRegistrySeedRow {
  readonly host: string;
  readonly hostName: string;
  readonly category: AppRegistryCategory;
}

export const APP_REGISTRY_SEED: ReadonlyArray<AppRegistrySeedRow> = [
  // macOS app bundle identifiers
  { platform: "macos", identifier: "com.apple.mail", hostName: "Apple Mail", category: "email" },
  {
    platform: "macos",
    identifier: "com.microsoft.outlook",
    hostName: "Outlook",
    category: "email",
  },
  {
    platform: "macos",
    identifier: "com.readdle.smartemail-mac",
    hostName: "Spark",
    category: "email",
  },
  {
    platform: "macos",
    identifier: "com.airmailapp.airmail3",
    hostName: "Airmail",
    category: "email",
  },
  {
    platform: "macos",
    identifier: "com.tinyspeck.slackmacgap",
    hostName: "Slack",
    category: "messaging",
  },
  { platform: "macos", identifier: "com.hnc.discord", hostName: "Discord", category: "messaging" },
  { platform: "macos", identifier: "com.microsoft.teams2", hostName: "Teams", category: "meeting" },
  {
    platform: "macos",
    identifier: "com.facebook.archon",
    hostName: "Messenger",
    category: "messaging",
  },
  {
    platform: "macos",
    identifier: "org.whispersystems.signal-desktop",
    hostName: "Signal",
    category: "messaging",
  },
  {
    platform: "macos",
    identifier: "com.microsoft.vscode",
    hostName: "VS Code",
    category: "code-editor",
  },
  {
    platform: "macos",
    identifier: "com.todesktop.230313mzl4w4u92",
    hostName: "Cursor",
    category: "code-editor",
  },
  { platform: "macos", identifier: "com.zed.zed", hostName: "Zed", category: "code-editor" },
  {
    platform: "macos",
    identifier: "com.jetbrains.intellij",
    hostName: "IntelliJ IDEA",
    category: "code-editor",
  },
  {
    platform: "macos",
    identifier: "com.googlecode.iterm2",
    hostName: "iTerm2",
    category: "terminal",
  },
  {
    platform: "macos",
    identifier: "com.apple.terminal",
    hostName: "Terminal",
    category: "terminal",
  },
  { platform: "macos", identifier: "com.google.chrome", hostName: "Chrome", category: "browser" },
  { platform: "macos", identifier: "com.brave.browser", hostName: "Brave", category: "browser" },
  {
    platform: "macos",
    identifier: "company.thebrowser.browser",
    hostName: "Arc",
    category: "browser",
  },
  { platform: "macos", identifier: "com.apple.safari", hostName: "Safari", category: "browser" },
  {
    platform: "macos",
    identifier: "org.mozilla.firefox",
    hostName: "Firefox",
    category: "browser",
  },
  { platform: "macos", identifier: "com.microsoft.edgemac", hostName: "Edge", category: "browser" },
  { platform: "macos", identifier: "com.microsoft.edge", hostName: "Edge", category: "browser" },
  // Browser extension generic host-only surface
  { platform: "extension", identifier: "browser", hostName: "Browser", category: "browser" },
  // Windows browser process names (sans .exe)
  { platform: "windows", identifier: "chrome", hostName: "Chrome", category: "browser" },
  { platform: "windows", identifier: "msedge", hostName: "Edge", category: "browser" },
  { platform: "windows", identifier: "brave", hostName: "Brave", category: "browser" },
  { platform: "windows", identifier: "opera", hostName: "Opera", category: "browser" },
  { platform: "windows", identifier: "vivaldi", hostName: "Vivaldi", category: "browser" },
  { platform: "windows", identifier: "chromium", hostName: "Chromium", category: "browser" },
  { platform: "windows", identifier: "firefox", hostName: "Firefox", category: "browser" },
  // Linux browser window classes
  { platform: "linux", identifier: "google-chrome", hostName: "Chrome", category: "browser" },
  { platform: "linux", identifier: "brave-browser", hostName: "Brave", category: "browser" },
  { platform: "linux", identifier: "microsoft-edge", hostName: "Edge", category: "browser" },
  { platform: "linux", identifier: "vivaldi-stable", hostName: "Vivaldi", category: "browser" },
  { platform: "linux", identifier: "chromium", hostName: "Chromium", category: "browser" },
  { platform: "linux", identifier: "firefox", hostName: "Firefox", category: "browser" },
  // Non-browser apps whose Windows process name and Linux window class are identical
  { platform: "windows", identifier: "slack", hostName: "Slack", category: "messaging" },
  { platform: "linux", identifier: "slack", hostName: "Slack", category: "messaging" },
  { platform: "windows", identifier: "discord", hostName: "Discord", category: "messaging" },
  { platform: "linux", identifier: "discord", hostName: "Discord", category: "messaging" },
  { platform: "windows", identifier: "code", hostName: "VS Code", category: "code-editor" },
  { platform: "linux", identifier: "code", hostName: "VS Code", category: "code-editor" },
  { platform: "windows", identifier: "cursor", hostName: "Cursor", category: "code-editor" },
  { platform: "linux", identifier: "cursor", hostName: "Cursor", category: "code-editor" },
  { platform: "windows", identifier: "signal", hostName: "Signal", category: "messaging" },
  { platform: "linux", identifier: "signal", hostName: "Signal", category: "messaging" },
  { platform: "windows", identifier: "zoom", hostName: "Zoom", category: "meeting" },
  { platform: "linux", identifier: "zoom", hostName: "Zoom", category: "meeting" },
  // Windows-only non-browser process names
  { platform: "windows", identifier: "ms-teams", hostName: "Teams", category: "meeting" },
  { platform: "windows", identifier: "outlook", hostName: "Outlook", category: "email" },
  { platform: "windows", identifier: "idea64", hostName: "IntelliJ IDEA", category: "code-editor" },
  { platform: "windows", identifier: "telegram", hostName: "Telegram", category: "messaging" },
  { platform: "windows", identifier: "whatsapp", hostName: "WhatsApp", category: "messaging" },
  { platform: "windows", identifier: "notion", hostName: "Notion", category: "notes" },
  {
    platform: "windows",
    identifier: "windowsterminal",
    hostName: "Terminal",
    category: "terminal",
  },
  // Linux-only non-browser window classes
  {
    platform: "linux",
    identifier: "jetbrains-idea",
    hostName: "IntelliJ IDEA",
    category: "code-editor",
  },
  {
    platform: "linux",
    identifier: "telegram-desktop",
    hostName: "Telegram",
    category: "messaging",
  },
  { platform: "linux", identifier: "thunderbird", hostName: "Thunderbird", category: "email" },
  { platform: "linux", identifier: "gnome-terminal", hostName: "Terminal", category: "terminal" },
  { platform: "linux", identifier: "konsole", hostName: "Konsole", category: "terminal" },
];

export const APP_HOST_REGISTRY_SEED: ReadonlyArray<AppHostRegistrySeedRow> = [
  { host: "mail.google.com", hostName: "Gmail", category: "email" },
  { host: "outlook.live.com", hostName: "Outlook Web", category: "email" },
  { host: "outlook.office.com", hostName: "Outlook Web", category: "email" },
  { host: "mail.proton.me", hostName: "Proton Mail", category: "email" },
  { host: "discord.com", hostName: "Discord Web", category: "messaging" },
  { host: "slack.com", hostName: "Slack Web", category: "messaging" },
  { host: "web.whatsapp.com", hostName: "WhatsApp Web", category: "messaging" },
  { host: "web.telegram.org", hostName: "Telegram Web", category: "messaging" },
  { host: "github.com", hostName: "GitHub", category: "code-editor" },
  { host: "gitlab.com", hostName: "GitLab", category: "code-editor" },
  { host: "linear.app", hostName: "Linear", category: "productivity" },
  { host: "notion.so", hostName: "Notion", category: "notes" },
  { host: "www.notion.so", hostName: "Notion", category: "notes" },
  { host: "figma.com", hostName: "Figma", category: "design" },
  { host: "meet.google.com", hostName: "Google Meet", category: "meeting" },
  { host: "zoom.us", hostName: "Zoom", category: "meeting" },
  { host: "teams.microsoft.com", hostName: "Teams Web", category: "meeting" },
];
