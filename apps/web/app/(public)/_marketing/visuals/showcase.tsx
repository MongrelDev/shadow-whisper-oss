import type { Locale } from "~/paraglide/runtime";

import { SceneAutoTyping } from "../../../_home/components/scenes/scene-auto-typing";
import { SceneCleanUp } from "../../../_home/components/scenes/scene-clean-up";
import { SceneDiffView } from "../../../_home/components/scenes/scene-diff-view";
import { SceneEcho } from "../../../_home/components/scenes/scene-echo";
import { SceneScratchpad } from "../../../_home/components/scenes/scene-scratchpad";
import { SceneSnippets } from "../../../_home/components/scenes/scene-snippets";
import { SceneTransformEmail } from "../../../_home/components/scenes/scene-transform-email";
import { SceneWhatsApp } from "../../../_home/components/scenes/scene-whatsapp";
import type { SceneCaption, SceneKey } from "../lib/types";

type SceneComponent = (props: {
  locale: Locale;
  kicker: string;
  title: string;
  description: string;
}) => React.ReactElement;

const SCENES: Record<SceneKey, SceneComponent> = {
  "auto-typing": SceneAutoTyping,
  "clean-up": SceneCleanUp,
  diff: SceneDiffView,
  snippets: SceneSnippets,
  email: SceneTransformEmail,
  whatsapp: SceneWhatsApp,
  echo: SceneEcho,
  scratchpad: SceneScratchpad,
};

/**
 * Renders one of the home product scenes (motion-animated) with localized
 * caption copy. Reused as hero art and as inline feature showcases.
 */
export function SceneShowcase({
  locale,
  scene,
  kicker,
  title,
  description,
}: SceneCaption & { locale: Locale }): React.ReactElement {
  const Scene = SCENES[scene];
  return <Scene locale={locale} kicker={kicker} title={title} description={description} />;
}
