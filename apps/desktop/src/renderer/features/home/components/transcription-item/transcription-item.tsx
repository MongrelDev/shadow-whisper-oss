import { TranscriptionItemActions } from "./transcription-item-actions";
import { TranscriptionItemBody } from "./transcription-item-body";
import {
  type TranscriptionItemContextValue,
  TranscriptionItemProvider,
} from "./transcription-item-context";
import { TranscriptionItemHeader } from "./transcription-item-header";
import { TranscriptionItemTimestamp } from "./transcription-item-timestamp";

interface TranscriptionItemRootProps {
  value: TranscriptionItemContextValue;
  children: React.ReactNode;
}

function Root({ value, children }: TranscriptionItemRootProps): React.ReactElement {
  return (
    <TranscriptionItemProvider value={value}>
      <div className="group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
        {children}
      </div>
    </TranscriptionItemProvider>
  );
}

export const TranscriptionItem = {
  Root,
  Timestamp: TranscriptionItemTimestamp,
  Header: TranscriptionItemHeader,
  Actions: TranscriptionItemActions,
  Body: TranscriptionItemBody,
};
