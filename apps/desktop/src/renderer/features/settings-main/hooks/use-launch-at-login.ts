import { useEffect } from "react";
import { useConfig } from "@/hooks/use-config";

export interface UseLaunchAtLoginResult {
  enabled: boolean;
  setEnabled: (next: boolean) => void;
}

/**
 * Keeps the persisted `launchAtLogin` preference in sync with the OS login-item
 * state (which the user can change outside the app) and exposes a setter that
 * writes both the OS item and the stored preference.
 */
export function useLaunchAtLogin(): UseLaunchAtLoginResult {
  const { config, updateConfig } = useConfig();
  const enabled = config.preferences.launchAtLogin;

  useEffect(() => {
    void window.api.settings.getLaunchAtLogin().then((osEnabled) => {
      if (osEnabled !== enabled) {
        updateConfig({ preferences: { launchAtLogin: osEnabled } });
      }
    });
  }, [enabled, updateConfig]);

  return {
    enabled,
    setEnabled: (next: boolean) => {
      window.api.settings.setLaunchAtLogin(next);
      updateConfig({ preferences: { launchAtLogin: next } });
    },
  };
}
