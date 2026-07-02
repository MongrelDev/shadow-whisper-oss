import { EventEmitter } from "node:events";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { app } from "electron";
import * as nativeInput from "@whisper/native-input";

interface HelperChild extends EventEmitter {
  readonly stdout: EventEmitter;
  readonly stderr: EventEmitter;
  readonly stdin: { write(chunk: string): boolean };
  readonly exitCode: number | null;
  readonly signalCode: NodeJS.Signals | null;
  kill(signal?: NodeJS.Signals | number): boolean;
}

export interface EditMonitorStartOpts {
  originalText: string;
  targetPid: number;
  sessionId: string;
  timeoutMs?: number;
  debounceMs?: number;
}

export type EditMonitorMode = "event-driven" | "polling-fallback";

export interface TextEditedEvent {
  sessionId: string;
  originalText: string;
  editedText: string;
  pid: number;
  bundleId: string | null;
  mode: EditMonitorMode;
}

export type StoppedReason = "timeout" | "external" | "helper-error" | "no-element" | "no-value";

export interface StoppedEvent {
  reason: StoppedReason;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_DEBOUNCE_MS = 1_500;
const POLL_INTERVAL_MS = 500;
const POLL_MAX_TICKS = 60;
const HELPER_EARLY_EXIT_MS = 200;
const SIGKILL_GRACE_MS = 1_000;

const ELECTRON_BUNDLE_WHITELIST = new Set<string>(["com.tinyspeck.slackmacgap", "com.hnc.Discord"]);

// eslint-disable-next-line complexity
function isElectronShapedBundle(bundleId: string | null): boolean {
  if (!bundleId) return false;
  if (ELECTRON_BUNDLE_WHITELIST.has(bundleId)) return true;
  if (bundleId === "com.github.Electron") return true;
  if (bundleId.startsWith("com.electron.")) return true;
  if (bundleId.endsWith(".electron")) return true;
  if (bundleId.includes(".electron.")) return true;
  return false;
}

function helperBinaryName(): string {
  switch (process.platform) {
    case "darwin":
      return "macos-text-monitor";
    case "win32":
      return "windows-text-monitor.exe";
    case "linux":
      return "linux-text-monitor";
    default:
      return "macos-text-monitor";
  }
}

function findFirstExisting(candidates: string[]): string | null {
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

function resolveHelperPath(): string {
  const binary = helperBinaryName();
  const isLinux = process.platform === "linux";

  const baseDir = app.isPackaged
    ? process.resourcesPath
    : path.join(__dirname, "../../../resources-build");

  const candidates = [path.join(baseDir, binary)];
  if (isLinux) candidates.push(path.join(baseDir, "linux-text-monitor.py"));

  return findFirstExisting(candidates) ?? candidates[0]!;
}

function helperIsExecutable(helperPath: string): boolean {
  if (!fs.existsSync(helperPath)) return false;

  // Python fallback requires python3 to be installed
  if (helperPath.endsWith(".py")) {
    const probe = spawnSync("python3", ["--version"], { timeout: 2000 });
    return probe.status === 0;
  }

  try {
    fs.accessSync(helperPath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

interface SpawnLike {
  (
    command: string,
    args: readonly string[],
    options: { stdio: ["pipe", "pipe", "pipe"] }
  ): HelperChild;
}

export interface EditMonitorDeps {
  spawnFn?: SpawnLike;
  helperPathOverride?: string;
  nativeInputOverride?: Pick<
    typeof nativeInput,
    "getBundleIdForPid" | "enableAccessibilityForPid" | "getFocusedFieldValueForPid"
  >;
}

export class EditMonitor extends EventEmitter {
  private child: HelperChild | null = null;
  private stdoutBuf = Buffer.alloc(0);
  private debounceTimer: NodeJS.Timeout | null = null;
  private timeoutTimer: NodeJS.Timeout | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private pollTicks = 0;
  private earlyExitTimer: NodeJS.Timeout | null = null;
  private helperReceivedAnyData = false;
  private opts: EditMonitorStartOpts | null = null;
  private bundleId: string | null = null;
  private originalText = "";
  private lastEdited = "";
  private debounceMs = DEFAULT_DEBOUNCE_MS;
  private active = false;
  private mode: EditMonitorMode = "event-driven";
  private readonly deps: EditMonitorDeps;

  constructor(deps: EditMonitorDeps = {}) {
    super();
    this.deps = deps;
  }

  private get spawnFn(): SpawnLike {
    return this.deps.spawnFn ?? (spawn as unknown as SpawnLike);
  }

  private get nativeApi(): NonNullable<EditMonitorDeps["nativeInputOverride"]> {
    return this.deps.nativeInputOverride ?? nativeInput;
  }

  // eslint-disable-next-line complexity
  start(opts: EditMonitorStartOpts): void {
    if (this.active) return;
    this.active = true;
    this.opts = opts;
    this.originalText = opts.originalText;
    this.lastEdited = opts.originalText;
    this.debounceMs = opts.debounceMs ?? DEFAULT_DEBOUNCE_MS;

    this.bundleId = this.nativeApi.getBundleIdForPid(opts.targetPid);
    const mode = isElectronShapedBundle(this.bundleId) ? "manual" : "enhanced";
    try {
      this.nativeApi.enableAccessibilityForPid(opts.targetPid, mode);
    } catch {
      // best-effort bootstrap; native call may legitimately fail on some bundles
    }

    const totalTimeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.timeoutTimer = setTimeout(() => this.stopWith("timeout"), totalTimeoutMs);

    const helperPath = this.deps.helperPathOverride ?? resolveHelperPath();
    if (!helperIsExecutable(helperPath)) {
      this.mode = "polling-fallback";
      this.startPolling();
      return;
    }

    this.mode = "event-driven";
    this.spawnHelper(helperPath, opts);
  }

  stop(): void {
    this.stopWith("external");
  }

  private stopWith(reason: StoppedReason): void {
    if (!this.active) return;
    this.active = false;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.earlyExitTimer) {
      clearTimeout(this.earlyExitTimer);
      this.earlyExitTimer = null;
    }

    this.killChild();

    const payload: StoppedEvent = { reason };
    this.emit("stopped", payload);
  }

  // eslint-disable-next-line complexity
  private killChild(): void {
    const child = this.child;
    if (!child) return;
    this.child = null;

    child.stdout?.removeAllListeners();
    child.stderr?.removeAllListeners();
    child.removeAllListeners();

    if (child.exitCode === null && child.signalCode === null) {
      try {
        child.kill("SIGTERM");
      } catch {
        // child may have already exited between exit-code check and kill
      }
      const killTimer = setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) {
          try {
            child.kill("SIGKILL");
          } catch {
            // ignore — process gone
          }
        }
      }, SIGKILL_GRACE_MS);
      // detach so a lingering kill timer doesn't keep node alive
      if (typeof killTimer.unref === "function") killTimer.unref();
    }
  }

  private spawnHelper(helperPath: string, opts: EditMonitorStartOpts): void {
    let child: HelperChild;
    try {
      const isPythonFallback = helperPath.endsWith(".py");
      const command = isPythonFallback ? "python3" : helperPath;
      const args = isPythonFallback
        ? [helperPath, String(opts.targetPid)]
        : [String(opts.targetPid)];
      child = this.spawnFn(command, args, {
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch {
      this.startPolling();
      return;
    }

    this.child = child;
    this.helperReceivedAnyData = false;

    try {
      child.stdin.write(`${opts.originalText}\n`);
    } catch {
      // stdin may already be closed if helper exited fast; the early-exit timer
      // catches that case
    }

    child.stdout.on("data", (chunk: Buffer) => {
      this.helperReceivedAnyData = true;
      this.handleStdoutChunk(chunk);
    });

    child.on("error", () => {
      // spawn failed asynchronously; transition to polling without re-emitting
      // stopped twice
      if (!this.active) return;
      this.killChild();
      this.mode = "polling-fallback";
      this.startPolling();
    });

    child.on("exit", () => {
      if (!this.active) return;
      // unexpected helper exit — fall back to polling rather than stopping
      this.killChild();
      this.mode = "polling-fallback";
      this.startPolling();
    });

    this.earlyExitTimer = setTimeout(() => {
      this.earlyExitTimer = null;
      if (!this.active) return;
      if (!this.helperReceivedAnyData && this.child) {
        // helper alive but silent for 200ms → still a normal startup; do nothing
      }
    }, HELPER_EARLY_EXIT_MS);
  }

  private handleStdoutChunk(chunk: Buffer): void {
    this.stdoutBuf = Buffer.concat([this.stdoutBuf, chunk]);
    let newlineIdx = this.stdoutBuf.indexOf(0x0a);
    while (newlineIdx !== -1) {
      const lineBuf = this.stdoutBuf.slice(0, newlineIdx);
      this.stdoutBuf = this.stdoutBuf.slice(newlineIdx + 1);
      const line = lineBuf.toString("utf8").replace(/\r$/, "");
      if (line.length > 0) this.handleLine(line);
      newlineIdx = this.stdoutBuf.indexOf(0x0a);
    }
  }

  // eslint-disable-next-line complexity
  private handleLine(line: string): void {
    if (!this.active) return;

    if (line === "NO_ELEMENT") {
      this.killChild();
      this.startPolling();
      return;
    }
    if (line === "NO_VALUE") {
      this.killChild();
      this.startPolling();
      return;
    }

    const colon = line.indexOf(":");
    if (colon === -1) return;
    const tag = line.slice(0, colon);
    const value = line.slice(colon + 1);

    switch (tag) {
      case "INITIAL_VALUE":
        this.lastEdited = value;
        return;
      case "INITIAL_VALUE_B64":
        this.lastEdited = Buffer.from(value, "base64").toString("utf8");
        return;
      case "CHANGED":
        this.lastEdited = value;
        this.scheduleDebouncedEmit();
        return;
      case "CHANGED_B64":
        this.lastEdited = Buffer.from(value, "base64").toString("utf8");
        this.scheduleDebouncedEmit();
        return;
      default:
        return;
    }
  }

  private scheduleDebouncedEmit(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.emitTextEditedIfChanged();
    }, this.debounceMs);
  }

  private emitTextEditedIfChanged(): void {
    if (!this.active || !this.opts) return;
    if (this.lastEdited === this.originalText) return;
    const payload: TextEditedEvent = {
      sessionId: this.opts.sessionId,
      originalText: this.originalText,
      editedText: this.lastEdited,
      pid: this.opts.targetPid,
      bundleId: this.bundleId,
      mode: this.mode,
    };
    this.emit("text-edited", payload);
  }

  private startPolling(): void {
    if (!this.active || this.pollTimer || !this.opts) return;
    const opts = this.opts;
    this.pollTicks = 0;

    const firstValue = this.nativeApi.getFocusedFieldValueForPid(opts.targetPid);
    if (firstValue === null) {
      this.stopWith("no-value");
      return;
    }
    if (firstValue !== this.lastEdited) {
      this.lastEdited = firstValue;
      this.scheduleDebouncedEmit();
    }

    this.pollTimer = setInterval(() => this.onPollTick(opts.targetPid), POLL_INTERVAL_MS);
  }

  private stopPollingIfMaxTicks(): boolean {
    if (this.pollTicks <= POLL_MAX_TICKS) return false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    return true;
  }

  private onPollTick(targetPid: number): void {
    if (!this.active) return;
    this.pollTicks += 1;
    if (this.stopPollingIfMaxTicks()) return;
    const value = this.nativeApi.getFocusedFieldValueForPid(targetPid);
    if (value === null) return;
    if (value !== this.lastEdited) {
      this.lastEdited = value;
      this.scheduleDebouncedEmit();
    }
  }
}
