import { Keyboard, Sparkles, Wand2 } from "lucide-react";

import { m } from "~/paraglide/messages";

export function FeatureList(): React.ReactElement {
  const features = [
    {
      icon: Keyboard,
      title: m.signup_feature_shortcut_title(),
      description: m.signup_feature_shortcut_desc(),
    },
    {
      icon: Sparkles,
      title: m.signup_feature_cleanup_title(),
      description: m.signup_feature_cleanup_desc(),
    },
    {
      icon: Wand2,
      title: m.signup_feature_skill_title(),
      description: m.signup_feature_skill_desc(),
    },
  ];

  return (
    <div className="space-y-5">
      {features.map(({ icon: Icon, title, description }) => (
        <div key={title} className="flex gap-3">
          <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
