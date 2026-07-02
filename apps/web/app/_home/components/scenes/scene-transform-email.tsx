"use client";

import { useState } from "react";
import type { Locale } from "~/paraglide/runtime";

import { Scene } from "./scene";
import { Cursor } from "./shared/cursor";
import { Pill, type PillState } from "./shared/pill";
import { useTimeline } from "./shared/use-timeline";
import { AppWindow } from "./shared/window";

type EmailCopy = {
  title: string;
  subtitle: string;
  oneLiner: string;
  email: string;
  skill: string;
  chipSend: string;
  chipAttach: string;
  chipDraft: string;
  fieldTo: string;
  toValue: string;
  fieldSubj: string;
  subject: string;
};

const COPY: Record<Locale, EmailCopy> = {
  en: {
    title: "Mail",
    subtitle: "New message",
    oneLiner: "Attached is the monthly expenses document",
    email: `Hi team,

Please find attached the detailed monthly expenses document for your review. Let me know if you have any questions.

Best regards,`,
    skill: "Transform to email",
    chipSend: "Send",
    chipAttach: "Attach",
    chipDraft: "Draft · autosaved",
    fieldTo: "To",
    toValue: "dana@studio.co",
    fieldSubj: "Subj",
    subject: "Monthly expenses",
  },
  "pt-BR": {
    title: "Mail",
    subtitle: "Nova mensagem",
    oneLiner: "Segue em anexo o documento de despesas do mês",
    email: `Olá, equipe,

Segue em anexo o documento detalhado de despesas do mês para revisão. Qualquer dúvida, é só me avisar.

Atenciosamente,`,
    skill: "Transformar em e-mail",
    chipSend: "Enviar",
    chipAttach: "Anexar",
    chipDraft: "Rascunho · salvo",
    fieldTo: "Para",
    toValue: "dana@studio.co",
    fieldSubj: "Assunto",
    subject: "Despesas do mês",
  },
};

const DURATION = 10000;

type Step = "idle" | "selected" | "processing" | "done";

type SceneState = {
  pill: PillState;
  step: Step;
  skillOn: boolean;
  cursor: { left: string; top: string };
};

const INITIAL: SceneState = {
  pill: "idle",
  step: "idle",
  skillOn: false,
  cursor: { left: "68%", top: "62%" },
};

function renderBody(step: Step, oneLiner: string, email: string): React.ReactElement {
  if (step === "selected" || step === "processing") {
    return <span className="selection">{oneLiner}</span>;
  }
  if (step === "done") {
    return <>{email}</>;
  }
  return <>{oneLiner}</>;
}

function SkillBadge({ on, label }: { on: boolean; label: string }): React.ReactElement {
  return (
    <div className={on ? "skill-badge on" : "skill-badge"}>
      <span className="ico">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4h16v16H4z" />
          <polyline points="4 8 12 13 20 8" />
        </svg>
      </span>
      <div className="sk">{label}</div>
    </div>
  );
}

function MailToolbar({ copy }: { copy: EmailCopy }): React.ReactElement {
  return (
    <div className="mail-toolbar">
      <span className="chip send">{copy.chipSend}</span>
      <span className="chip">{copy.chipAttach}</span>
      <span className="chip" style={{ marginLeft: "auto" }}>
        {copy.chipDraft}
      </span>
    </div>
  );
}

function MailFields({ copy }: { copy: EmailCopy }): React.ReactElement {
  return (
    <div className="mail-fields">
      <span className="k">{copy.fieldTo}</span>
      <span className="v">{copy.toValue}</span>
      <span className="k">{copy.fieldSubj}</span>
      <span className="v subject">{copy.subject}</span>
    </div>
  );
}

export function SceneTransformEmail({
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
        at: 500,
        run: () => setState((s) => ({ ...s, cursor: { left: "18%", top: "52%" } })),
      },
      { at: 1800, run: () => setState((s) => ({ ...s, step: "selected" })) },
      {
        at: 2500,
        run: () => setState((s) => ({ ...s, cursor: { left: "74%", top: "78%" } })),
      },
      {
        at: 3500,
        run: () =>
          setState((s) => ({ ...s, step: "processing", pill: "processing", skillOn: true })),
      },
      {
        at: 6500,
        run: () => setState((s) => ({ ...s, step: "done", pill: "idle", skillOn: false })),
      },
    ],
    DURATION,
    false
  );

  return (
    <Scene>
      <Scene.Frame tall cycle={cycle} duration={DURATION}>
        <AppWindow title={copy.title} subtitle={copy.subtitle}>
          <MailToolbar copy={copy} />
          <MailFields copy={copy} />
          <div className="notes-body" style={{ padding: "16px 18px" }}>
            <div className="body" style={{ whiteSpace: "pre-line" }}>
              {renderBody(state.step, copy.oneLiner, copy.email)}
            </div>
          </div>
        </AppWindow>
        <Cursor left={state.cursor.left} top={state.cursor.top} />
        <SkillBadge on={state.skillOn} label={copy.skill} />
        <Pill state={state.pill} locale={locale} />
      </Scene.Frame>
      <Scene.Meta kicker={kicker} title={title} description={description} />
    </Scene>
  );
}
