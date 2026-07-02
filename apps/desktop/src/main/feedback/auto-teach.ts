import * as nativeInput from "@whisper/native-input";
import { getConfig } from "../services/ConfigStore";
import { EditMonitor, type StoppedEvent, type TextEditedEvent } from "./edit-monitor";
import { extractCandidates } from "./candidate-extractor";
import { isBlockedBundle } from "./app-blocklist";
import { postAutoEditTeach } from "./teach-client";

export interface AutoTeachStartOpts {
  originalText: string;
  targetPid: number;
  sessionId: string;
  userDictionary: ReadonlySet<string>;
}

function logWideEvent(name: string, fields: Record<string, unknown>): void {
  console.log(`[wide-event] ${JSON.stringify({ event: name, ...fields })}`);
}

class AutoTeachCoordinator {
  private monitor: EditMonitor | null = null;

  start(opts: AutoTeachStartOpts): void {
    if (!getConfig().autoTeachEnabled) return;

    const bundleId = nativeInput.getBundleIdForPid(opts.targetPid);
    if (isBlockedBundle(bundleId)) {
      console.log(
        `[auto-teach] sessionId=${opts.sessionId} kind=skip reason=blocked-bundle bundleId=${bundleId}`
      );
      return;
    }

    if (this.monitor) {
      this.monitor.stop();
      this.monitor = null;
    }

    const monitor = new EditMonitor();
    this.monitor = monitor;

    const dispose = (): void => {
      monitor.removeAllListeners();
      if (this.monitor === monitor) this.monitor = null;
    };

    monitor.on("text-edited", (event: TextEditedEvent) => {
      const result = extractCandidates(event.originalText, event.editedText, opts.userDictionary);
      if (result.kind === "skip") {
        console.log(`[auto-teach] sessionId=${opts.sessionId} kind=skip reason=${result.reason}`);
        logWideEvent("auto_teach.skipped", {
          session_id: opts.sessionId,
          bundle_id: event.bundleId,
          reason: result.reason,
        });
      } else {
        const pairs = JSON.stringify(result.candidates);
        console.log(
          `[auto-teach] sessionId=${opts.sessionId} kind=send candidates=${pairs} bundleId=${event.bundleId ?? "null"} mode=${event.mode}`
        );
        logWideEvent("auto_teach.proposed", {
          session_id: opts.sessionId,
          bundle_id: event.bundleId,
          candidates_count: result.candidates.length,
          original_len: event.originalText.length,
          edited_len: event.editedText.length,
          mode: event.mode,
        });
        void postAutoEditTeach({
          selectedText: event.editedText,
          lastTranscriptionText: event.originalText,
          candidates: result.candidates,
        }).catch((err: unknown) => {
          console.warn(
            `[auto-teach] sessionId=${opts.sessionId} POST /teach failed: ${err instanceof Error ? err.message : String(err)}`
          );
        });
      }
      monitor.stop();
      dispose();
    });

    monitor.on("stopped", (event: StoppedEvent) => {
      console.log(
        `[auto-teach] sessionId=${opts.sessionId} kind=skip reason=monitor-stopped:${event.reason}`
      );
      dispose();
    });

    monitor.start({
      originalText: opts.originalText,
      targetPid: opts.targetPid,
      sessionId: opts.sessionId,
    });
  }

  stop(): void {
    if (this.monitor) {
      this.monitor.stop();
      this.monitor = null;
    }
  }
}

export const autoTeachCoordinator = new AutoTeachCoordinator();
