"use client";

import { useState } from "react";
import type { Locale } from "~/paraglide/runtime";

import { Scene } from "./scene";
import { Cursor } from "./shared/cursor";
import { Pill, type PillState } from "./shared/pill";
import { useTimeline } from "./shared/use-timeline";
import { AppWindow, NotesBody } from "./shared/window";

const COPY: Record<
  Locale,
  { title: string; subtitle: string; date: string; heading: string; messy: string; clean: string }
> = {
  en: {
    title: "Notes",
    subtitle: "Quick message",
    date: "Tue · 14:52",
    heading: "Message to Dana",
    messy: "so im gona send the doc to u tomorow cus today is to bussy ok",
    clean: "I will send the document to you tomorrow, as my schedule is quite full today.",
  },
  "pt-BR": {
    title: "Notas",
    subtitle: "Mensagem rápida",
    date: "Ter · 14:52",
    heading: "Mensagem pra Dana",
    messy: "vo manda o documento pra vc amanha pq hj to mt ocupado blz",
    clean: "Vou te enviar o documento amanhã, porque hoje meu dia está bem corrido.",
  },
};

const DURATION = 9000;

type Step = "messy" | "selected" | "processing" | "clean";

type SceneState = {
  pill: PillState;
  step: Step;
  cursor: { left: string; top: string };
};

const INITIAL: SceneState = {
  pill: "idle",
  step: "messy",
  cursor: { left: "66%", top: "80%" },
};

function renderBody(step: Step, messy: string, clean: string): React.ReactElement {
  if (step === "selected" || step === "processing") {
    return <span className="selection">{messy}</span>;
  }
  if (step === "clean") {
    return <>{clean}</>;
  }
  return <>{messy}</>;
}

export function SceneCleanUp({
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
      {
        at: 400,
        run: () => setState((s) => ({ ...s, cursor: { left: "12%", top: "40%" } })),
      },
      { at: 1800, run: () => setState((s) => ({ ...s, step: "selected" })) },
      {
        at: 2400,
        run: () => setState((s) => ({ ...s, cursor: { left: "72%", top: "58%" } })),
      },
      { at: 3600, run: () => setState((s) => ({ ...s, step: "processing", pill: "processing" })) },
      { at: 5600, run: () => setState((s) => ({ ...s, step: "clean", pill: "idle" })) },
    ],
    DURATION,
    false
  );

  return (
    <Scene>
      <Scene.Frame cycle={cycle} duration={DURATION}>
        <AppWindow title={copy.title} subtitle={copy.subtitle}>
          <NotesBody date={copy.date} heading={copy.heading}>
            {renderBody(state.step, copy.messy, copy.clean)}
          </NotesBody>
        </AppWindow>
        <Cursor left={state.cursor.left} top={state.cursor.top} />
        <Pill state={state.pill} locale={locale} />
      </Scene.Frame>
      <Scene.Meta kicker={kicker} title={title} description={description} />
    </Scene>
  );
}
