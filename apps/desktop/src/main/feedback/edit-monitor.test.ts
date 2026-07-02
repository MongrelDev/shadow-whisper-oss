import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "node:events";
import type { ChildProcessWithoutNullStreams } from "node:child_process";

const EXEC_PATH = "/bin/sh";

vi.mock("electron", () => ({
  app: { isPackaged: false },
}));

vi.mock("@whisper/native-input", () => ({
  getBundleIdForPid: vi.fn(() => "com.apple.Notes"),
  enableAccessibilityForPid: vi.fn(() => true),
  getFocusedFieldValueForPid: vi.fn(() => null),
}));

import { EditMonitor, type TextEditedEvent, type StoppedEvent } from "./edit-monitor";

interface FakeChild extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
  stdin: { write: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> };
  kill: ReturnType<typeof vi.fn>;
  exitCode: number | null;
  signalCode: NodeJS.Signals | null;
}

function makeFakeChild(): FakeChild {
  const child = new EventEmitter() as FakeChild;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = { write: vi.fn(), end: vi.fn() };
  child.kill = vi.fn();
  child.exitCode = null;
  child.signalCode = null;
  return child;
}

describe("EditMonitor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("emits text-edited once after debounce when stdout shows INITIAL_VALUE then CHANGED", () => {
    const fakeChild = makeFakeChild();
    const spawnFn = vi.fn(() => fakeChild as unknown as ChildProcessWithoutNullStreams);

    const monitor = new EditMonitor({
      spawnFn: spawnFn as never,
      helperPathOverride: EXEC_PATH,
    });

    const events: TextEditedEvent[] = [];
    monitor.on("text-edited", (e: TextEditedEvent) => events.push(e));

    monitor.start({
      sessionId: "sess-1",
      targetPid: 4242,
      originalText: "hello",
    });

    expect(spawnFn).toHaveBeenCalledTimes(1);
    expect(fakeChild.stdin.write).toHaveBeenCalledWith("hello\n");

    fakeChild.stdout.emit("data", Buffer.from("INITIAL_VALUE:hello\n"));
    fakeChild.stdout.emit("data", Buffer.from("CHANGED:hello world\n"));

    expect(events).toHaveLength(0);

    vi.advanceTimersByTime(1500);

    expect(events).toHaveLength(1);
    expect(events[0]?.editedText).toBe("hello world");
    expect(events[0]?.originalText).toBe("hello");
    expect(events[0]?.sessionId).toBe("sess-1");
    expect(events[0]?.pid).toBe(4242);
  });

  it("debounces rapid CHANGED lines into a single emit with the final value", () => {
    const fakeChild = makeFakeChild();
    const spawnFn = vi.fn(() => fakeChild as unknown as ChildProcessWithoutNullStreams);

    const monitor = new EditMonitor({
      spawnFn: spawnFn as never,
      helperPathOverride: EXEC_PATH,
    });

    const events: TextEditedEvent[] = [];
    monitor.on("text-edited", (e: TextEditedEvent) => events.push(e));

    monitor.start({
      sessionId: "sess-2",
      targetPid: 1,
      originalText: "a",
    });

    fakeChild.stdout.emit("data", Buffer.from("CHANGED:ab\n"));
    vi.advanceTimersByTime(500);
    fakeChild.stdout.emit("data", Buffer.from("CHANGED:abc\n"));
    vi.advanceTimersByTime(500);
    fakeChild.stdout.emit("data", Buffer.from("CHANGED:abcd\n"));
    vi.advanceTimersByTime(1500);

    expect(events).toHaveLength(1);
    expect(events[0]?.editedText).toBe("abcd");
  });

  it("decodes CHANGED_B64 lines as utf8", () => {
    const fakeChild = makeFakeChild();
    const spawnFn = vi.fn(() => fakeChild as unknown as ChildProcessWithoutNullStreams);

    const monitor = new EditMonitor({
      spawnFn: spawnFn as never,
      helperPathOverride: EXEC_PATH,
    });

    const events: TextEditedEvent[] = [];
    monitor.on("text-edited", (e: TextEditedEvent) => events.push(e));

    monitor.start({
      sessionId: "s",
      targetPid: 1,
      originalText: "café",
    });

    const encoded = Buffer.from("café au lait", "utf8").toString("base64");
    fakeChild.stdout.emit("data", Buffer.from(`CHANGED_B64:${encoded}\n`));
    vi.advanceTimersByTime(1500);

    expect(events).toHaveLength(1);
    expect(events[0]?.editedText).toBe("café au lait");
  });

  it("does not emit text-edited when edited text equals original", () => {
    const fakeChild = makeFakeChild();
    const spawnFn = vi.fn(() => fakeChild as unknown as ChildProcessWithoutNullStreams);

    const monitor = new EditMonitor({
      spawnFn: spawnFn as never,
      helperPathOverride: EXEC_PATH,
    });

    const events: TextEditedEvent[] = [];
    monitor.on("text-edited", (e: TextEditedEvent) => events.push(e));

    monitor.start({
      sessionId: "s",
      targetPid: 1,
      originalText: "hello",
    });

    fakeChild.stdout.emit("data", Buffer.from("CHANGED:hello world\n"));
    vi.advanceTimersByTime(500);
    fakeChild.stdout.emit("data", Buffer.from("CHANGED:hello\n"));
    vi.advanceTimersByTime(1500);

    expect(events).toHaveLength(0);
  });

  it("buffers stdout across chunks split mid-line", () => {
    const fakeChild = makeFakeChild();
    const spawnFn = vi.fn(() => fakeChild as unknown as ChildProcessWithoutNullStreams);

    const monitor = new EditMonitor({
      spawnFn: spawnFn as never,
      helperPathOverride: EXEC_PATH,
    });

    const events: TextEditedEvent[] = [];
    monitor.on("text-edited", (e: TextEditedEvent) => events.push(e));

    monitor.start({
      sessionId: "s",
      targetPid: 1,
      originalText: "a",
    });

    fakeChild.stdout.emit("data", Buffer.from("CHANG"));
    fakeChild.stdout.emit("data", Buffer.from("ED:abc"));
    fakeChild.stdout.emit("data", Buffer.from("d\nCHANGED:abcde\n"));
    vi.advanceTimersByTime(1500);

    expect(events).toHaveLength(1);
    expect(events[0]?.editedText).toBe("abcde");
  });

  it("emits stopped with timeout reason at default 30s", () => {
    const fakeChild = makeFakeChild();
    const spawnFn = vi.fn(() => fakeChild as unknown as ChildProcessWithoutNullStreams);

    const monitor = new EditMonitor({
      spawnFn: spawnFn as never,
      helperPathOverride: EXEC_PATH,
    });

    const stopped: StoppedEvent[] = [];
    monitor.on("stopped", (e: StoppedEvent) => stopped.push(e));

    monitor.start({
      sessionId: "s",
      targetPid: 1,
      originalText: "a",
    });

    vi.advanceTimersByTime(29_999);
    expect(stopped).toHaveLength(0);

    vi.advanceTimersByTime(2);
    expect(stopped).toHaveLength(1);
    expect(stopped[0]?.reason).toBe("timeout");
    expect(fakeChild.kill).toHaveBeenCalledWith("SIGTERM");
  });

  it("emits stopped with external reason on stop()", () => {
    const fakeChild = makeFakeChild();
    const spawnFn = vi.fn(() => fakeChild as unknown as ChildProcessWithoutNullStreams);

    const monitor = new EditMonitor({
      spawnFn: spawnFn as never,
      helperPathOverride: EXEC_PATH,
    });

    const stopped: StoppedEvent[] = [];
    monitor.on("stopped", (e: StoppedEvent) => stopped.push(e));

    monitor.start({
      sessionId: "s",
      targetPid: 1,
      originalText: "a",
    });

    monitor.stop();

    expect(stopped).toHaveLength(1);
    expect(stopped[0]?.reason).toBe("external");
  });

  it("falls back to polling when helper emits NO_ELEMENT", async () => {
    const fakeChild = makeFakeChild();
    const spawnFn = vi.fn(() => fakeChild as unknown as ChildProcessWithoutNullStreams);

    const polledValues = ["initial", "initial", "initial edited"];
    let pollIdx = 0;
    const nativeOverride = {
      getBundleIdForPid: vi.fn(() => "com.example.app"),
      enableAccessibilityForPid: vi.fn(() => true),
      getFocusedFieldValueForPid: vi.fn(() => polledValues[pollIdx++] ?? null),
    };

    const monitor = new EditMonitor({
      spawnFn: spawnFn as never,
      helperPathOverride: EXEC_PATH,
      nativeInputOverride: nativeOverride,
    });

    const events: TextEditedEvent[] = [];
    monitor.on("text-edited", (e: TextEditedEvent) => events.push(e));

    monitor.start({
      sessionId: "s",
      targetPid: 99,
      originalText: "initial",
    });

    fakeChild.stdout.emit("data", Buffer.from("NO_ELEMENT\n"));

    expect(nativeOverride.getFocusedFieldValueForPid).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    vi.advanceTimersByTime(500);
    vi.advanceTimersByTime(1500);

    expect(events).toHaveLength(1);
    expect(events[0]?.editedText).toBe("initial edited");
  });

  it("emits stopped with no-value when polling first read returns null", () => {
    const fakeChild = makeFakeChild();
    const spawnFn = vi.fn(() => fakeChild as unknown as ChildProcessWithoutNullStreams);

    const nativeOverride = {
      getBundleIdForPid: vi.fn(() => "com.example.app"),
      enableAccessibilityForPid: vi.fn(() => true),
      getFocusedFieldValueForPid: vi.fn(() => null),
    };

    const monitor = new EditMonitor({
      spawnFn: spawnFn as never,
      helperPathOverride: EXEC_PATH,
      nativeInputOverride: nativeOverride,
    });

    const stopped: StoppedEvent[] = [];
    monitor.on("stopped", (e: StoppedEvent) => stopped.push(e));

    monitor.start({
      sessionId: "s",
      targetPid: 99,
      originalText: "initial",
    });

    fakeChild.stdout.emit("data", Buffer.from("NO_VALUE\n"));

    expect(stopped).toHaveLength(1);
    expect(stopped[0]?.reason).toBe("no-value");
  });

  it("uses manual AX mode for Electron-shaped bundles", () => {
    const fakeChild = makeFakeChild();
    const spawnFn = vi.fn(() => fakeChild as unknown as ChildProcessWithoutNullStreams);

    const nativeOverride = {
      getBundleIdForPid: vi.fn(() => "com.tinyspeck.slackmacgap"),
      enableAccessibilityForPid: vi.fn(() => true),
      getFocusedFieldValueForPid: vi.fn(() => null),
    };

    const monitor = new EditMonitor({
      spawnFn: spawnFn as never,
      helperPathOverride: EXEC_PATH,
      nativeInputOverride: nativeOverride,
    });

    monitor.start({
      sessionId: "s",
      targetPid: 1,
      originalText: "a",
    });

    expect(nativeOverride.enableAccessibilityForPid).toHaveBeenCalledWith(1, "manual");
  });

  it("uses enhanced AX mode for non-Electron bundles", () => {
    const fakeChild = makeFakeChild();
    const spawnFn = vi.fn(() => fakeChild as unknown as ChildProcessWithoutNullStreams);

    const nativeOverride = {
      getBundleIdForPid: vi.fn(() => "com.apple.Notes"),
      enableAccessibilityForPid: vi.fn(() => true),
      getFocusedFieldValueForPid: vi.fn(() => null),
    };

    const monitor = new EditMonitor({
      spawnFn: spawnFn as never,
      helperPathOverride: EXEC_PATH,
      nativeInputOverride: nativeOverride,
    });

    monitor.start({
      sessionId: "s",
      targetPid: 1,
      originalText: "a",
    });

    expect(nativeOverride.enableAccessibilityForPid).toHaveBeenCalledWith(1, "enhanced");
  });

  it("does not emit text-edited after stop()", () => {
    const fakeChild = makeFakeChild();
    const spawnFn = vi.fn(() => fakeChild as unknown as ChildProcessWithoutNullStreams);

    const monitor = new EditMonitor({
      spawnFn: spawnFn as never,
      helperPathOverride: EXEC_PATH,
    });

    const events: TextEditedEvent[] = [];
    monitor.on("text-edited", (e: TextEditedEvent) => events.push(e));

    monitor.start({
      sessionId: "s",
      targetPid: 1,
      originalText: "a",
    });

    fakeChild.stdout.emit("data", Buffer.from("CHANGED:abc\n"));
    monitor.stop();
    vi.advanceTimersByTime(2000);

    expect(events).toHaveLength(0);
  });
});
