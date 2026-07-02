import { spawnSync, spawn } from "child_process";
import type { SpawnSyncReturns } from "child_process";

// ---------------------------------------------------------------------------
// Session detection (cached at module load)
// ---------------------------------------------------------------------------

interface LinuxSession {
  isWayland: boolean;
  desktop: string;
  isGnome: boolean;
  isKde: boolean;
  isWlroots: boolean;
  isHyprland: boolean;
}

const WLROOTS_COMPOSITORS = ["sway", "hyprland", "wayfire", "river", "dwl", "labwc", "cage"];

function detectSession(): LinuxSession {
  const env = process.env;
  const isWayland = env.XDG_SESSION_TYPE === "wayland" || typeof env.WAYLAND_DISPLAY === "string";

  const desktop = [env.XDG_CURRENT_DESKTOP, env.XDG_SESSION_DESKTOP, env.DESKTOP_SESSION]
    .filter(Boolean)
    .join(":")
    .toLowerCase();

  const isHyprland =
    desktop.includes("hyprland") || typeof env.HYPRLAND_INSTANCE_SIGNATURE === "string";

  const isWlroots =
    isHyprland ||
    typeof env.SWAYSOCK === "string" ||
    WLROOTS_COMPOSITORS.some((c) => desktop.includes(c));

  return {
    isWayland,
    desktop,
    isGnome: desktop.includes("gnome"),
    isKde: desktop.includes("kde"),
    isWlroots,
    isHyprland,
  };
}

const session: LinuxSession = detectSession();

// ---------------------------------------------------------------------------
// Tool availability cache (5-minute TTL)
// ---------------------------------------------------------------------------

const TOOL_CACHE_TTL_MS = 300_000;
const TOOL_TIMEOUT_MS = 2000;

const toolCache = new Map<string, { available: boolean; ts: number }>();

let ydotoolLegacy: boolean | null = null;

function commandExists(cmd: string): boolean {
  const cached = toolCache.get(cmd);
  if (cached && Date.now() - cached.ts < TOOL_CACHE_TTL_MS) return cached.available;

  const result = spawnSync("which", [cmd], {
    timeout: TOOL_TIMEOUT_MS,
    stdio: "pipe",
    encoding: "utf8",
  });
  const available = result.status === 0;
  toolCache.set(cmd, { available, ts: Date.now() });
  return available;
}

function isYdotoolLegacy(): boolean {
  if (ydotoolLegacy !== null) return ydotoolLegacy;
  if (!commandExists("ydotool")) {
    ydotoolLegacy = false;
    return false;
  }
  const result = spawnSync("ydotool", ["help"], {
    timeout: TOOL_TIMEOUT_MS,
    stdio: "pipe",
    encoding: "utf8",
  });
  ydotoolLegacy = !(result.stdout ?? "").includes("bakers");
  return ydotoolLegacy;
}

function isYdotoolDaemonRunning(): boolean {
  const uid = process.getuid?.() ?? 1000;
  const socketPaths = [
    process.env.YDOTOOL_SOCKET,
    `/run/user/${uid}/.ydotool_socket`,
    "/tmp/.ydotool_socket",
  ].filter(Boolean) as string[];

  for (const sock of socketPaths) {
    const check = spawnSync("test", ["-S", sock], { timeout: 1000, stdio: "pipe" });
    if (check.status === 0) return true;
  }

  const pidof = spawnSync("pidof", ["ydotoold"], { timeout: 1000, stdio: "pipe" });
  return pidof.status === 0;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function run(cmd: string, args: string[], input?: string): SpawnSyncReturns<string> {
  return spawnSync(cmd, args, {
    timeout: TOOL_TIMEOUT_MS,
    stdio: "pipe",
    encoding: "utf8",
    input,
  });
}

function runAsync(cmd: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "pipe", timeout: TOOL_TIMEOUT_MS });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve(false);
    }, TOOL_TIMEOUT_MS);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
    child.on("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

function tryRunForOutput(cmd: string, args: string[]): string | null {
  if (!commandExists(cmd)) return null;
  const result = run(cmd, args);
  if (result.status === 0 && result.stdout?.trim()) return result.stdout.trim();
  return null;
}

function tryRunWithInput(cmd: string, args: string[], input: string): boolean {
  if (!commandExists(cmd)) return false;
  return run(cmd, args, input).status === 0;
}

// ---------------------------------------------------------------------------
// Terminal detection
// ---------------------------------------------------------------------------

const TERMINAL_CLASSES = new Set([
  "konsole",
  "gnome-terminal",
  "gnome-terminal-server",
  "terminal",
  "kitty",
  "alacritty",
  "terminator",
  "xterm",
  "urxvt",
  "rxvt",
  "tilix",
  "terminology",
  "wezterm",
  "foot",
  "st",
  "yakuake",
  "ghostty",
  "guake",
  "tilda",
  "hyper",
  "tabby",
  "sakura",
  "warp",
  "termius",
  "waveterm",
]);

interface HyprctlWindow {
  class?: string;
  pid?: number;
}

function parseHyprctlActiveWindow(): HyprctlWindow | null {
  const output = tryRunForOutput("hyprctl", ["activewindow", "-j"]);
  if (!output) return null;
  try {
    return JSON.parse(output) as HyprctlWindow;
  } catch {
    return null;
  }
}

function getWindowClassViaTool(tool: string): string | null {
  const winId = tryRunForOutput(tool, ["getactivewindow"]);
  if (!winId) return null;
  const cls = tryRunForOutput(tool, ["getwindowclassname", winId]);
  return cls?.toLowerCase() ?? null;
}

function getHyprctlWindowClass(): string | null {
  return parseHyprctlActiveWindow()?.class?.toLowerCase() ?? null;
}

export function getActiveWindowClass(): string | null {
  if (session.isHyprland) {
    const cls = getHyprctlWindowClass();
    if (cls) return cls;
  }

  const tools = session.isKde ? ["xdotool", "kdotool"] : ["xdotool"];
  for (const tool of tools) {
    const cls = getWindowClassViaTool(tool);
    if (cls) return cls;
  }
  return null;
}

export function isTerminalWindow(windowClass: string | null): boolean {
  if (!windowClass) return false;
  return TERMINAL_CLASSES.has(windowClass);
}

// ---------------------------------------------------------------------------
// Clipboard operations
// ---------------------------------------------------------------------------

interface ClipboardTool {
  cmd: string;
  args: string[];
}

function clipboardReadTools(): ClipboardTool[] {
  const tools: ClipboardTool[] = [];
  if (session.isWayland && !session.isKde) {
    tools.push({ cmd: "wl-paste", args: ["--no-newline"] });
  }
  tools.push({ cmd: "xclip", args: ["-selection", "clipboard", "-o"] });
  tools.push({ cmd: "xsel", args: ["--clipboard", "--output"] });
  if (session.isWayland && session.isKde) {
    tools.push({ cmd: "wl-paste", args: ["--no-newline"] });
  }
  return tools;
}

function clipboardWriteTools(): ClipboardTool[] {
  const tools: ClipboardTool[] = [];
  // KDE Wayland: xclip first to work around clipboard desync
  if (session.isWayland && session.isKde) {
    tools.push({ cmd: "xclip", args: ["-selection", "clipboard"] });
  }
  if (session.isWayland) {
    tools.push({ cmd: "wl-copy", args: [] });
  }
  tools.push({ cmd: "xclip", args: ["-selection", "clipboard"] });
  tools.push({ cmd: "xsel", args: ["--clipboard", "--input"] });
  return tools;
}

export function snapshotClipboard(): string | null {
  for (const { cmd, args } of clipboardReadTools()) {
    if (!commandExists(cmd)) continue;
    const result = run(cmd, args);
    if (result.status === 0) return result.stdout;
  }
  return null;
}

export function writeClipboard(text: string): boolean {
  for (const { cmd, args } of clipboardWriteTools()) {
    if (tryRunWithInput(cmd, args, text)) return true;
  }
  return false;
}

function clearClipboard(): boolean {
  if (commandExists("xclip")) {
    // xclip with /dev/null clears the clipboard instead of setting empty string
    const result = spawnSync("xclip", ["-selection", "clipboard"], {
      timeout: TOOL_TIMEOUT_MS,
      stdio: ["pipe", "pipe", "pipe"],
      encoding: "utf8",
      input: "",
    });
    return result.status === 0;
  }
  return writeClipboard("");
}

export function restoreClipboard(text: string | null): boolean {
  if (text === null) return clearClipboard();
  return writeClipboard(text);
}

// ---------------------------------------------------------------------------
// Paste key simulation
// ---------------------------------------------------------------------------

// 29 = KEY_LEFTCTRL, 42 = KEY_LEFTSHIFT, 47 = KEY_V, 110 = KEY_INSERT
type PasteVariant = "ctrl-v" | "ctrl-shift-v" | "shift-insert";

interface PasteCandidate {
  cmd: string;
  args: string[];
}

function choosePasteVariant(isTerminal: boolean, windowClass: string | null): PasteVariant {
  if (!isTerminal) return "ctrl-v";
  if (windowClass === "konsole" && !session.isWayland) return "shift-insert";
  if (session.isWayland && !windowClass) return "shift-insert";
  return "ctrl-shift-v";
}

function xdotoolPasteArgs(variant: PasteVariant, windowId: string | null): string[] {
  const key =
    variant === "shift-insert"
      ? "shift+Insert"
      : variant === "ctrl-shift-v"
        ? "ctrl+shift+v"
        : "ctrl+v";
  if (windowId) return ["windowactivate", "--sync", windowId, "key", key];
  return ["key", key];
}

function ydotoolPasteArgs(variant: PasteVariant): string[] {
  const legacy = isYdotoolLegacy();
  if (variant === "shift-insert") {
    return legacy ? ["key", "shift+Insert"] : ["key", "42:1", "110:1", "110:0", "42:0"];
  }
  if (variant === "ctrl-shift-v") {
    return legacy
      ? ["key", "ctrl+shift+v"]
      : ["key", "29:1", "42:1", "47:1", "47:0", "42:0", "29:0"];
  }
  return legacy ? ["key", "ctrl+v"] : ["key", "29:1", "47:1", "47:0", "29:0"];
}

function wtypePasteArgs(variant: PasteVariant): string[] {
  if (variant === "shift-insert") return ["-M", "shift", "-k", "Insert", "-m", "shift"];
  if (variant === "ctrl-shift-v")
    return ["-M", "ctrl", "-M", "shift", "-k", "v", "-m", "shift", "-m", "ctrl"];
  return ["-M", "ctrl", "-k", "v", "-m", "ctrl"];
}

function buildPasteCandidates(variant: PasteVariant): PasteCandidate[] {
  const canXdotool = commandExists("xdotool");
  const canYdotool = commandExists("ydotool") && isYdotoolDaemonRunning();
  const canWtype = session.isWayland && commandExists("wtype");

  const windowId = canXdotool ? tryRunForOutput("xdotool", ["getactivewindow"]) : null;

  const entries: Array<{ available: boolean; candidate: PasteCandidate }> = [
    {
      available: canXdotool,
      candidate: { cmd: "xdotool", args: xdotoolPasteArgs(variant, windowId) },
    },
    { available: canYdotool, candidate: { cmd: "ydotool", args: ydotoolPasteArgs(variant) } },
    { available: canWtype, candidate: { cmd: "wtype", args: wtypePasteArgs(variant) } },
  ];

  const order = compositorToolOrder();
  return order
    .map((name) => entries.find((e) => e.candidate.cmd === name))
    .filter((e): e is { available: boolean; candidate: PasteCandidate } => !!e && e.available)
    .map((e) => e.candidate);
}

function compositorToolOrder(): string[] {
  if (!session.isWayland) return ["xdotool", "ydotool"];
  if (session.isWlroots) return ["wtype", "xdotool", "ydotool"];
  return ["ydotool", "xdotool", "wtype"];
}

export async function sendPasteKey(
  isTerminal: boolean,
  windowClass: string | null
): Promise<boolean> {
  const candidates = buildPasteCandidates(choosePasteVariant(isTerminal, windowClass));
  for (const { cmd, args } of candidates) {
    if (await runAsync(cmd, args)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Frontmost PID
// ---------------------------------------------------------------------------

function getXdotoolPid(): number | null {
  const winId = tryRunForOutput("xdotool", ["getactivewindow"]);
  if (!winId) return null;
  const pidStr = tryRunForOutput("xdotool", ["getwindowpid", winId]);
  if (!pidStr) return null;
  const n = parseInt(pidStr, 10);
  return n > 0 ? n : null;
}

export function getFrontmostPid(): number | null {
  if (session.isHyprland) {
    const pid = parseHyprctlActiveWindow()?.pid;
    if (typeof pid === "number" && pid > 0) return pid;
  }
  return getXdotoolPid();
}

// ---------------------------------------------------------------------------
// Clipboard restore delay
// ---------------------------------------------------------------------------

export function getRestoreDelayMs(): number {
  if (session.isKde && session.isWayland) return 600;
  return 200;
}

// ---------------------------------------------------------------------------
// Module constructor — wires Linux functions into NativeInputModule shape
// ---------------------------------------------------------------------------

export interface LinuxNativeModule {
  typeText(text: string): boolean;
  checkAccessibility(promptIfNeeded?: boolean): boolean;
  hasFocusedTextField(): boolean;
  getSelectedText(): string | null;
  getSelectedTextViaClipboard(): string | null;
  getFocusedAppContext(): { bundleId?: string; accessibilityTrusted?: boolean } | null;
  getFrontmostPid(): number | null;
  snapshotClipboard(): string | null;
  writeClipboard(text: string): boolean;
  restoreClipboard(text: string | null): boolean;
}

export function createLinuxModule(): LinuxNativeModule {
  return {
    typeText: () => {
      console.warn("@whisper/native-input: typeText() is not supported on Linux, use insertText()");
      return false;
    },
    checkAccessibility: () => true,
    hasFocusedTextField: () => true,
    getSelectedText: () => null,
    getSelectedTextViaClipboard: () => null,
    getFocusedAppContext: () => {
      const cls = getActiveWindowClass();
      if (!cls) return null;
      return { bundleId: cls, accessibilityTrusted: true };
    },
    getFrontmostPid,
    snapshotClipboard,
    writeClipboard,
    restoreClipboard,
  };
}
