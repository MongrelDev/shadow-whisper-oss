"use client";

import { useState } from "react";
import type { Locale } from "~/paraglide/runtime";

import { Scene } from "./scene";
import { Pill, type PillState } from "./shared/pill";
import { useTimeline } from "./shared/use-timeline";
import { AppWindow, Caret, NotesBody } from "./shared/window";

type BrainCopy = {
  appTitle: string;
  appSub: string;
  date: string;
  heading: string;
  notes: readonly [string, string];
  lead: string;
  value: string;
  tail: string;
  tag: string;
};

const PERSONAS: Record<Locale, BrainCopy[]> = {
  en: [
    {
      appTitle: "Notes",
      appSub: "Proposal · draft",
      date: "Tue · 09:12",
      heading: "Acme — proposal",
      notes: ["Acme Corp", "Pricing"],
      lead: "Re-opening the project for Acme at the same rate we agreed, ",
      value: "$3,200",
      tail: ".",
      tag: "from your Scratch Pad",
    },
    {
      appTitle: "Notes",
      appSub: "Contract · draft",
      date: "Thu · 16:05",
      heading: "Renewal — notes",
      notes: ["Globex", "Terms"],
      lead: "The Globex contract is up for renewal on, ",
      value: "March 14",
      tail: ".",
      tag: "from your Scratch Pad",
    },
    {
      appTitle: "Notes",
      appSub: "Kickoff · recap",
      date: "Wed · 10:30",
      heading: "Onboarding — recap",
      notes: ["Onboarding", "Decisions"],
      lead: "As we agreed at kickoff, onboarding ships behind, ",
      value: "a feature flag",
      tail: ".",
      tag: "from your Scratch Pad",
    },
  ],
  "pt-BR": [
    {
      appTitle: "Notas",
      appSub: "Proposta · rascunho",
      date: "Ter · 09:12",
      heading: "Acme — proposta",
      notes: ["Acme", "Preços"],
      lead: "Reabrindo o projeto para a Acme pelo mesmo valor que combinamos, ",
      value: "R$ 4.200",
      tail: ".",
      tag: "do seu Scratch Pad",
    },
    {
      appTitle: "Notas",
      appSub: "Contrato · rascunho",
      date: "Qui · 16:05",
      heading: "Renovação — notas",
      notes: ["Globex", "Condições"],
      lead: "O contrato da Globex vence para renovação em, ",
      value: "14 de março",
      tail: ".",
      tag: "do seu Scratch Pad",
    },
    {
      appTitle: "Notas",
      appSub: "Kickoff · resumo",
      date: "Qua · 10:30",
      heading: "Onboarding — resumo",
      notes: ["Onboarding", "Decisões"],
      lead: "Como combinamos no kickoff, o onboarding sai atrás de, ",
      value: "uma feature flag",
      tail: ".",
      tag: "do seu Scratch Pad",
    },
  ],
};

const DURATION = 9500;

type Phase = "idle" | "recall" | "typing" | "filled";

type SceneState = {
  pill: PillState;
  phase: Phase;
};

const INITIAL: SceneState = { pill: "idle", phase: "idle" };

function NoteRail({
  on,
  notes,
}: {
  on: boolean;
  notes: readonly [string, string];
}): React.ReactElement {
  return (
    <div className={on ? "note-rail on" : "note-rail"}>
      {notes.map((note) => (
        <span key={note} className="note-chip">
          <span className="br">[[</span>
          {note}
          <span className="br">]]</span>
        </span>
      ))}
    </div>
  );
}

export function SceneScratchpad({
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

  const cycle = useTimeline(
    [
      { at: 0, run: () => setState(INITIAL) },
      { at: 600, run: () => setState({ pill: "idle", phase: "recall" }) },
      { at: 2200, run: () => setState({ pill: "transcribing", phase: "typing" }) },
      { at: 4000, run: () => setState({ pill: "idle", phase: "filled" }) },
    ],
    DURATION,
    false
  );

  const personas = PERSONAS[locale];
  const copy = personas[cycle % personas.length] ?? personas[0]!;

  const railOn = state.phase !== "idle";
  const showLead = state.phase === "typing" || state.phase === "filled";
  const filled = state.phase === "filled";

  return (
    <Scene>
      <Scene.Frame cycle={cycle} duration={DURATION}>
        <AppWindow title={copy.appTitle} subtitle={copy.appSub}>
          <NotesBody date={copy.date} heading={copy.heading}>
            {showLead ? copy.lead : null}
            {filled ? (
              <>
                <span className="recall">{copy.value}</span>
                {copy.tail}
                <span className="recall-tag">{copy.tag}</span>
              </>
            ) : null}
            {!filled ? <Caret /> : null}
          </NotesBody>
        </AppWindow>
        <NoteRail on={railOn} notes={copy.notes} />
        <Pill state={state.pill} locale={locale} />
      </Scene.Frame>
      <Scene.Meta kicker={kicker} title={title} description={description} />
    </Scene>
  );
}
