"use client";

import { useState } from "react";
import type { Locale } from "~/paraglide/runtime";

import { Scene } from "./scene";
import { Pill, type PillState } from "./shared/pill";
import { useTimeline } from "./shared/use-timeline";
import { AppWindow, Caret, NotesBody } from "./shared/window";

const COPY: Record<Locale, { title: string; subtitle: string; date: string; text: string }> = {
  en: {
    title: "Notes",
    subtitle: "Design · 3 PM sync",
    date: "Tue · 14:47",
    text: "Just a quick note to review the latest design iterations before our sync at 3 PM.",
  },
  "pt-BR": {
    title: "Notas",
    subtitle: "Design · call das 15h",
    date: "Ter · 14:47",
    text: "Só um lembrete pra revisar as últimas mudanças de design antes da nossa call das 15h.",
  },
};

const DURATION = 8000;

type SceneState = {
  pill: PillState;
  body: "empty" | "typed";
};

const INITIAL: SceneState = { pill: "idle", body: "empty" };

export function SceneAutoTyping({
  locale,
  kicker,
  title,
  description,
}: {
  locale: Locale;
  kicker: string;
  title: string;
  description: string;
}): React.ReactElement {
  const [state, setState] = useState<SceneState>(INITIAL);
  const copy = COPY[locale];

  const cycle = useTimeline(
    [
      { at: 0, run: () => setState(INITIAL) },
      { at: 800, run: () => setState({ pill: "transcribing", body: "empty" }) },
      { at: 4800, run: () => setState({ pill: "idle", body: "typed" }) },
    ],
    DURATION,
    false
  );

  return (
    <Scene>
      <Scene.Frame cycle={cycle} duration={DURATION}>
        <AppWindow title={copy.title} subtitle={copy.subtitle}>
          <NotesBody date={copy.date} heading={copy.subtitle}>
            {state.body === "typed" ? copy.text : null}
            <Caret />
          </NotesBody>
        </AppWindow>
        <Pill state={state.pill} locale={locale} />
      </Scene.Frame>
      <Scene.Meta kicker={kicker} title={title} description={description} />
    </Scene>
  );
}
