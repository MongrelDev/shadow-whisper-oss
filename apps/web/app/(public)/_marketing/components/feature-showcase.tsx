import type { Locale } from "~/paraglide/runtime";

import type { SceneCaption } from "../lib/types";
import { SceneShowcase } from "../visuals/showcase";

export function FeatureShowcase({
  locale,
  scenes,
}: {
  locale: Locale;
  scenes: readonly SceneCaption[];
}): React.ReactElement {
  if (scenes.length === 1) {
    return (
      <div className="mx-auto max-w-3xl">
        {scenes.map((scene) => (
          <SceneShowcase key={scene.scene} locale={locale} {...scene} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {scenes.map((scene) => (
        <SceneShowcase key={scene.scene} locale={locale} {...scene} />
      ))}
    </div>
  );
}
