-- macOS app bundle identifiers
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.apple.mail', 'Apple Mail', 'email', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.microsoft.outlook', 'Outlook', 'email', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.readdle.smartemail-mac', 'Spark', 'email', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.airmailapp.airmail3', 'Airmail', 'email', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.tinyspeck.slackmacgap', 'Slack', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.hnc.discord', 'Discord', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.microsoft.teams2', 'Teams', 'meeting', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.facebook.archon', 'Messenger', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','org.whispersystems.signal-desktop', 'Signal', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.microsoft.vscode', 'VS Code', 'code-editor', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.todesktop.230313mzl4w4u92', 'Cursor', 'code-editor', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.zed.zed', 'Zed', 'code-editor', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.jetbrains.intellij', 'IntelliJ IDEA', 'code-editor', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.googlecode.iterm2', 'iTerm2', 'terminal', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.apple.terminal', 'Terminal', 'terminal', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.google.chrome', 'Chrome', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.brave.browser', 'Brave', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','company.thebrowser.browser', 'Arc', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.apple.safari', 'Safari', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','org.mozilla.firefox', 'Firefox', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.microsoft.edgemac', 'Edge', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('macos','com.microsoft.edge', 'Edge', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
-- Browser extension generic host-only surface
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('extension', 'browser', 'Browser', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
-- Windows browser process names (sans .exe)
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'chrome', 'Chrome', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'msedge', 'Edge', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'brave', 'Brave', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'opera', 'Opera', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'vivaldi', 'Vivaldi', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'chromium', 'Chromium', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'firefox', 'Firefox', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
-- Linux browser window classes
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'google-chrome', 'Chrome', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'brave-browser', 'Brave', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'microsoft-edge', 'Edge', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'vivaldi-stable', 'Vivaldi', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'chromium', 'Chromium', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'firefox', 'Firefox', 'browser', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
-- Non-browser apps whose Windows process name and Linux window class are identical
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'slack', 'Slack', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'slack', 'Slack', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'discord', 'Discord', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'discord', 'Discord', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'code', 'VS Code', 'code-editor', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'code', 'VS Code', 'code-editor', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'cursor', 'Cursor', 'code-editor', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'cursor', 'Cursor', 'code-editor', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'signal', 'Signal', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'signal', 'Signal', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'zoom', 'Zoom', 'meeting', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'zoom', 'Zoom', 'meeting', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
-- Windows-only non-browser process names
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'ms-teams', 'Teams', 'meeting', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'outlook', 'Outlook', 'email', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'idea64', 'IntelliJ IDEA', 'code-editor', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'telegram', 'Telegram', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'whatsapp', 'WhatsApp', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'notion', 'Notion', 'notes', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('windows', 'windowsterminal', 'Terminal', 'terminal', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
-- Linux-only non-browser window classes
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'jetbrains-idea', 'IntelliJ IDEA', 'code-editor', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'telegram-desktop', 'Telegram', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'thunderbird', 'Thunderbird', 'email', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'gnome-terminal', 'Terminal', 'terminal', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_registry (platform, identifier, host_name, category, created_at, updated_at) VALUES ('linux', 'konsole', 'Konsole', 'terminal', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
-- Website hosts (platform-agnostic, shared by desktop browsers and the extension)
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('mail.google.com', 'Gmail', 'email', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('outlook.live.com', 'Outlook Web', 'email', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('outlook.office.com', 'Outlook Web', 'email', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('mail.proton.me', 'Proton Mail', 'email', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('discord.com', 'Discord Web', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('slack.com', 'Slack Web', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('web.whatsapp.com', 'WhatsApp Web', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('web.telegram.org', 'Telegram Web', 'messaging', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('github.com', 'GitHub', 'code-editor', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('gitlab.com', 'GitLab', 'code-editor', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('linear.app', 'Linear', 'productivity', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('notion.so', 'Notion', 'notes', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('www.notion.so', 'Notion', 'notes', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('figma.com', 'Figma', 'design', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('meet.google.com', 'Google Meet', 'meeting', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('zoom.us', 'Zoom', 'meeting', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
--> statement-breakpoint
INSERT OR REPLACE INTO app_host_registry (host, host_name, category, created_at, updated_at) VALUES ('teams.microsoft.com', 'Teams Web', 'meeting', (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
