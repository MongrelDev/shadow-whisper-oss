import { useNavigate } from "@tanstack/react-router";
import { useConfig, DEFAULT_PREFERENCES } from "@/hooks/use-config";
import { Button } from "@/components/ui/button";
import { m } from "~/paraglide/messages";
import { useLaunchAtLogin } from "../hooks/use-launch-at-login";
import { SettingsCard, Row, Toggle, RestoreButton } from "./settings-primitives";

export function GeneralSection(): React.ReactElement {
  const { config, updateConfig } = useConfig();
  const launchAtLogin = useLaunchAtLogin();
  const navigate = useNavigate();
  const prefs = config.preferences;
  const audio = prefs.audio;
  const isDefaultGeneral =
    prefs.launchAtLogin === DEFAULT_PREFERENCES.launchAtLogin &&
    audio.enableSounds === DEFAULT_PREFERENCES.audio.enableSounds &&
    audio.shouldMuteAudio === DEFAULT_PREFERENCES.audio.shouldMuteAudio &&
    audio.localAudioRetention === DEFAULT_PREFERENCES.audio.localAudioRetention;

  return (
    <SettingsCard>
      <Row
        label={m.settings_general_launch_label()}
        sublabel={m.settings_general_launch_sublabel()}
      >
        <Toggle
          enabled={launchAtLogin.enabled}
          onToggle={() => launchAtLogin.setEnabled(!launchAtLogin.enabled)}
        />
      </Row>
      <Row
        label={m.settings_general_sounds_label()}
        sublabel={m.settings_general_sounds_sublabel()}
      >
        <Toggle
          enabled={audio.enableSounds}
          onToggle={() => {
            updateConfig({ preferences: { audio: { enableSounds: !audio.enableSounds } } });
          }}
        />
      </Row>
      <Row label={m.settings_general_mute_label()} sublabel={m.settings_general_mute_sublabel()}>
        <Toggle
          enabled={audio.shouldMuteAudio}
          onToggle={() => {
            updateConfig({
              preferences: { audio: { shouldMuteAudio: !audio.shouldMuteAudio } },
            });
          }}
        />
      </Row>
      <Row
        label={m.settings_general_retention_label()}
        sublabel={m.settings_general_retention_sublabel()}
      >
        <Toggle
          enabled={audio.localAudioRetention}
          onToggle={() => {
            if (audio.localAudioRetention) {
              navigate({
                to: ".",
                search: (prev) => ({ ...prev, confirm: "delete-audio" }),
              });
            } else {
              updateConfig({ preferences: { audio: { localAudioRetention: true } } });
            }
          }}
        />
      </Row>
      <Row
        label={m.settings_general_onboarding_label()}
        sublabel={m.settings_general_onboarding_sublabel()}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            updateConfig({ preferences: { onboardingCompleted: false } });
            navigate({ to: "/app", search: { onboarding: "welcome" } });
          }}
        >
          {m.settings_general_onboarding_button()}
        </Button>
      </Row>
      <Row
        label={m.settings_general_restore_label()}
        sublabel={m.settings_general_restore_sublabel()}
      >
        <RestoreButton
          onClick={() =>
            updateConfig({
              preferences: {
                launchAtLogin: DEFAULT_PREFERENCES.launchAtLogin,
                audio: {
                  enableSounds: DEFAULT_PREFERENCES.audio.enableSounds,
                  shouldMuteAudio: DEFAULT_PREFERENCES.audio.shouldMuteAudio,
                  localAudioRetention: DEFAULT_PREFERENCES.audio.localAudioRetention,
                },
              },
            })
          }
          disabled={isDefaultGeneral}
        />
      </Row>
    </SettingsCard>
  );
}
