import { useCallback, useEffect, useRef } from "react";
import { ActionPill } from "~/features/pill/components/action-pill";
import { PillToast } from "~/features/pill/components/pill-toast";
import { useMinimizedPill } from "~/features/pill/hooks/use-minimized-pill";
import { usePillToast, type ShowToast } from "~/features/pill/hooks/use-pill-toast";
import { usePillTranscript } from "~/features/pill/hooks/use-pill-transcript";
import { usePillVisibility } from "~/features/pill/hooks/use-pill-visibility";
import { getCapturedTarget, useTargetCapture } from "~/features/pill/hooks/use-target-capture";
import { handleInsertResult } from "~/features/pill/lib/handle-insert-result";
import { insertText, type CapturedTarget } from "~/features/pill/lib/insert-text";
import { useRecordingState } from "~/features/transcription/hooks/use-recording-state";
import { usePillBadgeUnlock } from "~/features/progress/pill/hooks/use-pill-badge-unlock";
import { Toaster } from "sonner";
import { PaywallBanner } from "~/features/billing/components/paywall-banner";
import { errorMessageForCode } from "~/lib/error-messages";

const FREE_TIER_WORD_LIMIT = 2000;

type Mode = "idle" | "recording" | "processing";

function deriveMode(recordingState: string): Mode {
  if (recordingState === "recording") return "recording";
  if (recordingState === "processing") return "processing";
  return "idle";
}

function sendStart(): void {
  void chrome.runtime.sendMessage({ target: "background", type: "sp:request-start" });
}

function sendStop(): void {
  void chrome.runtime.sendMessage({ target: "background", type: "sp:request-stop" });
}

function openSidePanel(): void {
  void chrome.runtime.sendMessage({ target: "background", type: "content:open-side-panel" });
}

type PillBodyProps = {
  mode: Mode;
  onRecord: () => void;
  onStop: () => void;
  showToast: ShowToast;
};

function PillBody(props: PillBodyProps) {
  return <ActionPill phase={props.mode} onRecord={props.onRecord} onStop={props.onStop} />;
}

type UseTranscriptErrorOptions = {
  error: string | null;
  isQuotaExceeded: boolean;
  clear: () => void;
  showToast: ShowToast;
};

function useTranscriptError({
  error,
  isQuotaExceeded,
  clear,
  showToast,
}: UseTranscriptErrorOptions): void {
  useEffect(() => {
    if (!error) return;
    if (isQuotaExceeded) return;
    showToast(errorMessageForCode(error), "error");
    clear();
  }, [error, isQuotaExceeded, clear, showToast]);
}

type AutoInsertDeps = {
  capturedRef: React.MutableRefObject<CapturedTarget | null>;
  clear: () => void;
  showToast: ShowToast;
};

function useAutoInsert(transcript: string | null, deps: AutoInsertDeps): void {
  const depsRef = useRef(deps);
  depsRef.current = deps;
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!transcript) {
      handledRef.current = null;
      return;
    }
    if (handledRef.current === transcript) return;
    handledRef.current = transcript;

    const { capturedRef, clear, showToast } = depsRef.current;
    const target = capturedRef.current ?? getCapturedTarget();
    capturedRef.current = null;
    void insertText(transcript, target).then((result) => {
      handleInsertResult(result, showToast);
      clear();
    });
  }, [transcript]);
}

function usePillState() {
  useTargetCapture();
  const visible = usePillVisibility();
  const recordingState = useRecordingState();
  const { transcript, error: transcriptError, isQuotaExceeded, clear } = usePillTranscript();
  const { toast, showToast } = usePillToast();
  const capturedRef = useRef<CapturedTarget | null>(null);

  const mode = deriveMode(recordingState);

  const handleRecord = useCallback(() => {
    capturedRef.current = getCapturedTarget();
    sendStart();
  }, []);

  useAutoInsert(transcript, { capturedRef, clear, showToast });
  useTranscriptError({ error: transcriptError, isQuotaExceeded, clear, showToast });

  return {
    visible,
    mode,
    toast,
    showToast,
    handleRecord,
    capturedRef,
    isQuotaExceeded,
    clearQuotaError: clear,
  };
}

const EASE_IN =
  "max-width 200ms cubic-bezier(0.4, 0, 0.2, 1), max-height 200ms cubic-bezier(0.4, 0, 0.2, 1)";
const EASE_OUT =
  "max-width 150ms cubic-bezier(0.4, 0, 0.2, 1), max-height 150ms cubic-bezier(0.4, 0, 0.2, 1)";

const EXPANDED_MAX_HEIGHT: Record<Mode, number> = {
  recording: 32,
  processing: 32,
  idle: 32,
};

function getContainerStyle(isExpanded: boolean, mode: Mode): React.CSSProperties {
  return {
    maxWidth: isExpanded ? 220 : 42,
    maxHeight: isExpanded ? EXPANDED_MAX_HEIGHT[mode] : 6,
    overflow: isExpanded ? "visible" : "hidden",
    transition: isExpanded ? EASE_IN : EASE_OUT,
  };
}

const LAYER_STYLES = {
  bgExpanded: {
    opacity: 0,
    transition: "opacity 80ms ease",
    position: "absolute" as const,
    pointerEvents: "none" as const,
  },
  bgCollapsed: {
    opacity: 1,
    transition: "opacity 120ms ease 100ms",
    position: "absolute" as const,
    pointerEvents: "auto" as const,
  },
  fgExpanded: { opacity: 1, transition: "opacity 120ms ease 80ms", pointerEvents: "auto" as const },
  fgCollapsed: { opacity: 0, transition: "opacity 80ms ease", pointerEvents: "none" as const },
} as const;

function getLayerStyle(isExpanded: boolean, foreground: boolean): React.CSSProperties {
  if (foreground) return isExpanded ? LAYER_STYLES.fgExpanded : LAYER_STYLES.fgCollapsed;
  return isExpanded ? LAYER_STYLES.bgExpanded : LAYER_STYLES.bgCollapsed;
}

type PillContentProps = {
  mode: Mode;
  isExpanded: boolean;
  handleRecord: () => void;
  showToast: ShowToast;
};

function PillContent(props: PillContentProps) {
  return (
    <div style={getContainerStyle(props.isExpanded, props.mode)}>
      <div style={getLayerStyle(props.isExpanded, false)}>
        <div
          className="bg-background/50 border border-border/60 backdrop-blur-sm rounded-full"
          style={{ width: 42, height: 6 }}
        />
      </div>
      <div style={getLayerStyle(props.isExpanded, true)}>
        <PillBody
          mode={props.mode}
          onRecord={props.handleRecord}
          onStop={sendStop}
          showToast={props.showToast}
        />
      </div>
    </div>
  );
}

type QuotaPaywallProps = {
  onDismiss: () => void;
};

function QuotaPaywall({ onDismiss }: QuotaPaywallProps) {
  return (
    <PaywallBanner limit={FREE_TIER_WORD_LIMIT} onUpgrade={openSidePanel} onDismiss={onDismiss} />
  );
}

function isBackgroundToast(
  msg: unknown
): msg is { target: "content"; type: "bg:show-toast"; message: string; variant: "info" | "error" } {
  if (typeof msg !== "object" || msg === null) return false;
  const obj = msg as { target?: unknown; type?: unknown };
  return obj.target === "content" && obj.type === "bg:show-toast";
}

function isCopyToClipboard(
  msg: unknown
): msg is { target: "content"; type: "bg:copy-to-clipboard"; text: string } {
  if (typeof msg !== "object" || msg === null) return false;
  const obj = msg as { target?: unknown; type?: unknown };
  return obj.target === "content" && obj.type === "bg:copy-to-clipboard";
}

function useBackgroundMessages(showToast: ShowToast): void {
  useEffect(() => {
    const handler = (msg: unknown) => {
      if (isBackgroundToast(msg)) {
        showToast(msg.message, msg.variant, 4000);
        return;
      }
      if (isCopyToClipboard(msg)) {
        void navigator.clipboard.writeText(msg.text).catch(() => {});
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [showToast]);
}

export function PillShell() {
  const state = usePillState();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useBackgroundMessages(state.showToast);

  const { isExpanded, handlers } = useMinimizedPill({
    mode: state.mode,
    isToastVisible: !!state.toast.message,
  });

  usePillBadgeUnlock();

  return (
    <>
      <div
        ref={containerRef}
        data-shadow-whisper="pill"
        data-shadow-whisper-host="true"
        onMouseEnter={handlers.onMouseEnter}
        onMouseLeave={handlers.onMouseLeave}
        onFocus={handlers.onFocus}
        onBlur={handlers.onBlur}
        style={{
          position: "fixed",
          bottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2147483647,
          isolation: "isolate",
          padding: 6,
          background: "transparent",
          display: state.visible ? undefined : "none",
        }}
        role={isExpanded ? "toolbar" : undefined}
        aria-label="ShadowWhisper"
        className="relative select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        tabIndex={0}
      >
        {state.isQuotaExceeded ? (
          <QuotaPaywall onDismiss={state.clearQuotaError} />
        ) : (
          <PillContent
            mode={state.mode}
            isExpanded={isExpanded}
            handleRecord={state.handleRecord}
            showToast={state.showToast}
          />
        )}
        <PillToast toast={state.toast} />
      </div>
      <Toaster position="top-right" richColors />
    </>
  );
}
