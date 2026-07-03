import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mergeConfig } from "../../shared/config-merge";

export const DEFAULT_CONFIG: AppConfigData = {
  shortcuts: {
    transcription: "CommandOrControl+Alt+W",
    pasteLastTranscript: "CommandOrControl+Alt+V",
    cancelRecording: "Escape",
    viewLastDiff: "CommandOrControl+Alt+O",
    actionMode: "CommandOrControl+Alt+A",
  },
  preferences: {
    theme: "light",
    locale: "en",
    selectedLanguages: ["pt", "en"],
    launchAtLogin: false,
    notifications: true,
    onboardingCompleted: false,
    seenTourSteps: [],
    privacyMode: true,
    useCases: [],
    audio: {
      enableSounds: true,
      shouldMuteAudio: false,
      soundFolder: false,
      inputDeviceId: false,
      outputDeviceId: false,
      localAudioRetention: true,
    },
  },
  ui: {
    sidebarCollapsed: false,
  },
  skills: {
    shortcuts: {},
    successfulExecutionCount: 0,
  },
  nudges: {
    skillDiscovery: {
      eligibleAt: null,
      lastShownAt: null,
      lastClickedAt: null,
      timesShown: 0,
      successfulTranscriptionCount: 0,
    },
    cleanupDiff: {
      eligibleAt: null,
      lastShownAt: null,
      lastClickedAt: null,
      timesShown: 0,
    },
  },
  autoTeachEnabled: false,
};

export const DEFAULT_SHORTCUTS = DEFAULT_CONFIG.shortcuts;
export const DEFAULT_PREFERENCES = DEFAULT_CONFIG.preferences;
export const DEFAULT_UI = DEFAULT_CONFIG.ui;

function applyPatch(prev: AppConfigData, patch: AppConfigPatch): AppConfigData {
  return mergeConfig(prev, patch);
}

export function useConfig() {
  const queryClient = useQueryClient();

  const { data: config = DEFAULT_CONFIG, isFetched: loaded } = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const result = await window.api.config.get();
      if (!result.success || !result.data) return DEFAULT_CONFIG;
      return result.data;
    },
    placeholderData: DEFAULT_CONFIG,
  });

  const { mutate: updateConfig } = useMutation({
    mutationFn: async (patch: AppConfigPatch) => {
      const result = await window.api.config.set(patch);
      if (!result.success) throw new Error(result.error ?? "Failed to save config");
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: ["config"] });
      const previous = queryClient.getQueryData<AppConfigData>(["config"]);
      queryClient.setQueryData<AppConfigData>(["config"], (old) =>
        applyPatch(old ?? DEFAULT_CONFIG, patch)
      );
      return { previous };
    },
    onError: (_err, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(["config"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["config"] }),
  });

  return { config, updateConfig, loaded };
}
