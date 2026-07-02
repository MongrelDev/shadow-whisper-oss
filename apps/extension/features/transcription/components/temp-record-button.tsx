import { useCallback, useEffect, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { useRecordingState } from "~/features/transcription/hooks/use-recording-state";
import { addExtensionHistoryEntry } from "~/features/history/lib/history-storage";
import type { RecordingState } from "~/lib/messaging/types";
import { isSidepanelTranscriptMessage } from "~/lib/messaging/transcript-guards";
import { errorMessageForCode } from "~/lib/error-messages";
import { cn } from "~/lib/utils";
import { m } from "~/paraglide/messages";

type Phase = "idle" | "recording" | "transcribing";

const stateToPhase: Record<RecordingState, Phase> = {
  idle: "idle",
  recording: "recording",
  processing: "transcribing",
};

const phaseStyles: Record<Phase, string> = {
  idle: "bg-primary text-primary-foreground hover:bg-primary/90",
  recording: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  transcribing: "bg-primary text-primary-foreground hover:bg-primary/90",
};

function useHasMicPermission(): { hasMicPermission: boolean | null } {
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      chrome.storage.local.get("sw_mic_permission_granted").then((result) => {
        setHasMicPermission(!!result["sw_mic_permission_granted"]);
      });
    };

    check();

    const onChanged = (changes: Record<string, chrome.storage.StorageChange>) => {
      if ("sw_mic_permission_granted" in changes) {
        setHasMicPermission(!!changes["sw_mic_permission_granted"]?.newValue);
      }
    };

    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, []);

  return { hasMicPermission };
}

function GrantPermissionButton() {
  const handleGrant = useCallback(() => {
    void chrome.tabs.create({ url: chrome.runtime.getURL("permission.html") });
  }, []);

  return (
    <button
      type="button"
      onClick={handleGrant}
      className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      {m.record_grant_microphone_access()}
    </button>
  );
}

function getPhaseLabel(phase: Phase): string {
  const labels: Record<Phase, string> = {
    idle: m.record_start(),
    recording: m.record_stop(),
    transcribing: m.record_transcribing(),
  };

  return labels[phase];
}

function PhaseIcon({ phase }: { phase: Phase }): React.ReactElement {
  if (phase === "transcribing") return <Loader2 className="size-4 animate-spin" />;
  if (phase === "recording") return <Square className="size-4 fill-current" />;
  return <Mic className="size-4" />;
}

function RecordActionButton({
  phase,
  onClick,
}: {
  phase: Phase;
  onClick: () => void;
}): React.ReactElement {
  const isTranscribing = phase === "transcribing";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isTranscribing}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        phaseStyles[phase]
      )}
    >
      <PhaseIcon phase={phase} />
      {getPhaseLabel(phase)}
    </button>
  );
}

function ResultMessages({ transcript, error }: { transcript: string; error: string | null }) {
  return (
    <>
      {transcript && (
        <p className="rounded-lg border border-border bg-card px-3 py-2 text-sm leading-6 text-foreground">
          {transcript}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </>
  );
}

function useTranscriptBroadcast(
  onFinal: (text: string, durationMs: number) => void,
  onError: (code: string) => void
): void {
  useEffect(() => {
    const listener = (msg: unknown) => {
      if (!isSidepanelTranscriptMessage(msg)) return;
      if (msg.type === "bg:transcript-final") {
        onFinal(msg.text, msg.durationMs);
      } else if (msg.type === "bg:transcript-error") {
        onError(msg.code);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [onFinal, onError]);
}

export function TempRecordButton() {
  const recordingState = useRecordingState();
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const phase: Phase = stateToPhase[recordingState];

  const { hasMicPermission } = useHasMicPermission();

  const handleFinal = useCallback((text: string, durationMs: number) => {
    setTranscript(text);
    setError(null);
    void addExtensionHistoryEntry({
      text,
      rawText: text,
      durationSeconds: durationMs / 1000,
      sessionId: Date.now(),
    });
  }, []);

  const handleError = useCallback((code: string) => {
    setError(errorMessageForCode(code));
  }, []);

  useTranscriptBroadcast(handleFinal, handleError);

  const handleClick = useCallback(() => {
    setError(null);
    if (phase === "idle") {
      void chrome.runtime.sendMessage({ target: "background", type: "sp:request-start" });
    } else if (phase === "recording") {
      void chrome.runtime.sendMessage({ target: "background", type: "sp:request-stop" });
    }
  }, [phase]);

  if (hasMicPermission === false) {
    return <GrantPermissionButton />;
  }

  return (
    <div className="flex flex-col gap-4">
      <RecordActionButton phase={phase} onClick={handleClick} />
      <ResultMessages transcript={transcript} error={error} />
    </div>
  );
}
