"use client";

import { useState } from "react";
import type { Locale } from "~/paraglide/runtime";

import { Scene } from "./scene";
import { Pill, type PillState } from "./shared/pill";
import { useTimeline } from "./shared/use-timeline";
import { AppWindow, Caret, NotesBody } from "./shared/window";

type EchoCopy = {
  appTitle: string;
  appSub: string;
  date: string;
  heading: string;
  lead: string;
  question: string;
  source: string;
  answer: string;
  hint: string;
};

const PERSONAS: Record<Locale, EchoCopy[]> = {
  en: [
    {
      appTitle: "Notes",
      appSub: "Chart · draft",
      date: "Tue · 14:47",
      heading: "Visit — summary",
      lead: "Flu symptoms. Acetaminophen, ",
      question: "adult dose?",
      source: "Label",
      answer: "750 mg every 6h",
      hint: "Check the label",
    },
    {
      appTitle: "Notes",
      appSub: "Standup · main.ts",
      date: "Wed · 09:12",
      heading: "Refactor notes",
      lead: "Cleaned up the parser. Array.map, ",
      question: "returns a new array?",
      source: "MDN",
      answer: "Yes, never mutates",
      hint: "Doesn't touch the original",
    },
    {
      appTitle: "Notes",
      appSub: "Case · draft",
      date: "Thu · 16:30",
      heading: "Filing notes",
      lead: "Client wants to appeal. Window, ",
      question: "how many days?",
      source: "Rules",
      answer: "15 days to file",
      hint: "Confirm the deadline",
    },
  ],
  "pt-BR": [
    {
      appTitle: "Notas",
      appSub: "Prontuário · rascunho",
      date: "Ter · 14:47",
      heading: "Consulta — resumo",
      lead: "Quadro de gripe. Paracetamol, ",
      question: "dose adulta?",
      source: "Bula",
      answer: "750 mg a cada 6h",
      hint: "Confira a bula",
    },
    {
      appTitle: "Notas",
      appSub: "Daily · main.ts",
      date: "Qua · 09:12",
      heading: "Notas do refactor",
      lead: "Ajustei o parser. Array.map, ",
      question: "retorna novo array?",
      source: "MDN",
      answer: "Sim, nunca muta",
      hint: "Não altera o original",
    },
    {
      appTitle: "Notas",
      appSub: "Processo · rascunho",
      date: "Qui · 16:30",
      heading: "Notas do caso",
      lead: "Cliente quer recorrer. Prazo, ",
      question: "quantos dias?",
      source: "CPC",
      answer: "15 dias pra recorrer",
      hint: "Confira o prazo",
    },
  ],
};

const DURATION = 9000;

type Phase = "idle" | "typing" | "asking" | "answered";

type SceneState = {
  pill: PillState;
  phase: Phase;
};

const INITIAL: SceneState = { pill: "idle", phase: "idle" };

function SparkIcon(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

function AnswerNote({ on, copy }: { on: boolean; copy: EchoCopy }): React.ReactElement {
  return (
    <div className={on ? "answer-note on" : "answer-note"}>
      <span className="ico">
        <SparkIcon />
      </span>
      <div className="txt">
        <div className="src">{copy.source}</div>
        <div className="ttl">{copy.answer}</div>
      </div>
      <span className="hint">{copy.hint}</span>
    </div>
  );
}

export function SceneEcho({
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
      { at: 700, run: () => setState({ pill: "transcribing", phase: "typing" }) },
      { at: 2400, run: () => setState({ pill: "transcribing", phase: "asking" }) },
      { at: 3700, run: () => setState({ pill: "idle", phase: "answered" }) },
    ],
    DURATION,
    false
  );

  const personas = PERSONAS[locale];
  const copy = personas[cycle % personas.length] ?? personas[0]!;

  const showLead = state.phase !== "idle";
  const showQuestion = state.phase === "asking" || state.phase === "answered";
  const answered = state.phase === "answered";

  return (
    <Scene>
      <Scene.Frame cycle={cycle} duration={DURATION}>
        <AppWindow title={copy.appTitle} subtitle={copy.appSub}>
          <NotesBody date={copy.date} heading={copy.heading}>
            {showLead ? copy.lead : null}
            {showQuestion ? <span className="ask">{copy.question}</span> : null}
            {!answered ? <Caret /> : null}
          </NotesBody>
        </AppWindow>
        <AnswerNote on={answered} copy={copy} />
        <Pill state={state.pill} locale={locale} />
      </Scene.Frame>
      <Scene.Meta kicker={kicker} title={title} description={description} />
    </Scene>
  );
}
