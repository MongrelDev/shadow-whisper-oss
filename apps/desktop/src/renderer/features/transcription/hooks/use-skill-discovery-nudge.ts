import { useConfig } from "@/hooks/use-config";

const TRANSCRIPTION_THRESHOLD = 5;

export function useSkillDiscoveryNudge(): boolean {
  const { config } = useConfig();
  const { skillDiscovery } = config.nudges;

  if (skillDiscovery.successfulTranscriptionCount < TRANSCRIPTION_THRESHOLD) return false;
  if (config.skills.successfulExecutionCount > 0) return false;
  if (skillDiscovery.lastShownAt !== null) return false;

  return true;
}
