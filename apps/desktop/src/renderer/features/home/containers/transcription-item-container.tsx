import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { m } from "~/paraglide/messages";
import { useAudioPlayer } from "@/components/ui/audio-player";
import type { Transcription } from "@/lib/db";
import { TranscriptionItem } from "@/features/home/components/transcription-item/transcription-item";
import type { TranscriptionItemView } from "@/features/home/components/transcription-item/transcription-item-context";
import { audioRecordingRepository } from "@/features/transcription/repositories/audio-recording-repository";
import { copyText, deleteHistoryEntry } from "../lib/history-actions";

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";

  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
}

function useAudioBlobUrl(userId: string, sessionId: number | null): { audioUrl: string | null } {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId == null) return;

    let revoked = false;
    let objectUrl: string | null = null;

    audioRecordingRepository.findBySession({ userId, sessionId }).then((audio) => {
      if (revoked || !audio) return;
      objectUrl = URL.createObjectURL(audio.blob);
      setAudioUrl(objectUrl);
    });

    return () => {
      revoked = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [userId, sessionId]);

  return { audioUrl };
}

function buildVisibleText({
  entry,
  textView,
  isCancelled,
  hasFormatted,
}: {
  entry: Transcription;
  textView: TranscriptionItemView;
  isCancelled: boolean;
  hasFormatted: boolean;
}): string {
  if (isCancelled && !hasFormatted) return "";
  return textView === "raw" ? entry.rawText : entry.formattedText;
}

function getCopySuccessMessage(textView: TranscriptionItemView): string {
  return textView === "raw"
    ? m.home_transcription_copy_success_raw()
    : m.home_transcription_copy_success();
}

function TranscriptionItemContainerContent({
  entry,
}: {
  entry: Transcription;
}): React.ReactElement {
  const [textView, setTextView] = useState<TranscriptionItemView>("formatted");
  const [copied, setCopied] = useState(false);
  const { audioUrl } = useAudioBlobUrl(entry.userId, entry.sessionId);
  const player = useAudioPlayer();
  const isCurrentItemActive = player.isItemActive(entry.id);

  const time = new Date(entry.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const duration = formatDuration(entry.durationSeconds);
  const isCancelled = entry.status === "cancelled";
  const hasFormatted = !!entry.formattedText.trim();
  const hasRaw = !!entry.rawText.trim();
  const canToggleText = hasFormatted && hasRaw && entry.formattedText !== entry.rawText;
  const visibleText = buildVisibleText({ entry, textView, isCancelled, hasFormatted });
  const view = isCurrentItemActive ? "player" : textView;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await deleteHistoryEntry(entry);
    },
    onSuccess: () => {
      toast.success(m.home_transcription_delete_success());
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : m.home_transcription_delete_error_default();
      toast.error(message);
    },
  });

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    const text = visibleText.trim();
    if (!text) return;

    try {
      await copyText(text);
      setCopied(true);
      toast.success(getCopySuccessMessage(textView));
    } catch {
      toast.error(m.home_transcription_copy_error());
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(m.home_transcription_confirm_delete());
    if (!confirmed) return;
    await deleteMutation.mutateAsync();
  };

  const handleTogglePlayer = () => {
    if (!audioUrl) return;

    if (isCurrentItemActive) {
      void player.pause();
      void player.setActiveItem(null);
      return;
    }

    void player.play({ id: entry.id, src: audioUrl });
  };

  const handleToggleRaw = () => {
    setTextView((prev) => (prev === "raw" ? "formatted" : "raw"));
  };

  return (
    <TranscriptionItem.Root
      value={{
        entryId: entry.id,
        time,
        duration,
        totalDurationSeconds: entry.durationSeconds,
        language: entry.language,
        wordCount: entry.wordCount,
        visibleText,
        audioUrl,
        view,
        copied,
        canToggleText,
        isCancelled,
        deletePending: deleteMutation.isPending,
        deleteDisabled: deleteMutation.isPending,
        onCopy: () => void handleCopy(),
        onToggleRaw: handleToggleRaw,
        onTogglePlayer: handleTogglePlayer,
        onDelete: () => void handleDelete(),
      }}
    >
      <TranscriptionItem.Timestamp />
      <div className="min-w-0 flex-1">
        <TranscriptionItem.Body />
        <TranscriptionItem.Header />
      </div>
      <TranscriptionItem.Actions />
    </TranscriptionItem.Root>
  );
}

export function TranscriptionItemContainer({
  entry,
}: {
  entry: Transcription;
}): React.ReactElement {
  return <TranscriptionItemContainerContent entry={entry} />;
}
