import { createContext, useContext } from "react";

export type TranscriptionItemView = "formatted" | "raw";

export interface TranscriptionItemContextValue {
  entryId: number;
  time: string;
  duration: string;
  totalDurationSeconds: number;
  language: string;
  wordCount: number;
  visibleText: string;
  audioUrl: string | null;
  view: TranscriptionItemView | "player";
  copied: boolean;
  canToggleText: boolean;
  isCancelled: boolean;
  deletePending: boolean;
  deleteDisabled: boolean;
  onCopy: () => void;
  onToggleRaw: () => void;
  onTogglePlayer: () => void;
  onDelete: () => void;
}

const TranscriptionItemContext = createContext<TranscriptionItemContextValue | null>(null);

export function TranscriptionItemProvider({
  value,
  children,
}: {
  value: TranscriptionItemContextValue;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <TranscriptionItemContext.Provider value={value}>{children}</TranscriptionItemContext.Provider>
  );
}

export function useTranscriptionItem(): TranscriptionItemContextValue {
  const value = useContext(TranscriptionItemContext);

  if (!value) {
    throw new Error("useTranscriptionItem must be used within TranscriptionItemProvider");
  }

  return value;
}
