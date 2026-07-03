import { m } from "~/paraglide/messages";
import {
  ActiveRecordingPill,
  ProcessingPill,
} from "@/features/transcription/components/active-recording-pill";

interface ActionModeRecordingPillProps {
  isSpeaking: boolean;
  volumeLevel: number;
  waveformHistory: number[];
  onCancel: () => void;
  onStop: () => void;
}

export function ActionModeRecordingPill(props: ActionModeRecordingPillProps): React.ReactElement {
  return <ActiveRecordingPill variant="action" {...props} />;
}

export function ActionModeProcessingPill(): React.ReactElement {
  return <ProcessingPill variant="action" label={m.pill_action_mode_processing_label()} />;
}
