import { useConfig } from "@/hooks/use-config";
import { Button } from "@/components/ui/button";
import { m } from "~/paraglide/messages";
import { useAccessibilityStatus } from "../hooks/use-accessibility-status";
import { Row, SettingsCard, Toggle } from "./settings-primitives";

export function LearningSection(): React.ReactElement {
  const { config, updateConfig } = useConfig();
  const accessibility = useAccessibilityStatus();

  const enabled = config.autoTeachEnabled;
  const showAccessibilityWarning = enabled && !accessibility.granted;

  return (
    <SettingsCard>
      <Row label={m.settings_auto_teach_title()} sublabel={m.settings_auto_teach_description()}>
        <Toggle enabled={enabled} onToggle={() => updateConfig({ autoTeachEnabled: !enabled })} />
      </Row>
      {showAccessibilityWarning && (
        <Row
          label={m.settings_auto_teach_title()}
          sublabel={m.settings_auto_teach_accessibility_warning()}
        >
          <Button variant="outline" size="sm" onClick={accessibility.requestAccess}>
            {m.settings_auto_teach_grant_accessibility_button()}
          </Button>
        </Row>
      )}
    </SettingsCard>
  );
}
