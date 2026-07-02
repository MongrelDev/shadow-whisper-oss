import { useConfig } from "@/hooks/use-config";

export function useTranscriptionSettings() {
  const { config } = useConfig();

  const selectedLanguages = config.preferences.selectedLanguages;
  const language = selectedLanguages.length === 1 ? selectedLanguages[0]! : "auto";

  return { language, config };
}
