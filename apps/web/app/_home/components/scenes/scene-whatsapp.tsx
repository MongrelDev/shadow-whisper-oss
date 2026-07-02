"use client";

import { useState } from "react";
import type { Locale } from "~/paraglide/runtime";

import { Scene } from "./scene";
import { Pill, type PillState } from "./shared/pill";
import { useTimeline } from "./shared/use-timeline";
import { AppWindow } from "./shared/window";

const AFFILIATE_URL = "https://app.shadowwhisper.com/?ref=mongrel";

type WhatsAppCopy = {
  contact: string;
  status: string;
  them: string;
  reply1: string;
  reply2: string;
  snippetSaved: string;
  snippetKey: string;
  placeholder: string;
};

const COPY: Record<Locale, WhatsAppCopy> = {
  en: {
    contact: "Dana",
    status: "online",
    them: "Is the tool worth it? Thinking about the trial this weekend.",
    reply1: "It's great! It cleans up everything I dictate, punctuation and all.",
    reply2: "Here, use my affiliate link and get 30 days free:",
    snippetSaved: "Snippet · saved",
    snippetKey: "my affiliate link",
    placeholder: "Type a message",
  },
  "pt-BR": {
    contact: "Dana",
    status: "online",
    them: "Vale a pena a ferramenta? Pensando em testar no fim de semana.",
    reply1: "Vale muito! Ele organiza tudo que eu dito, já com pontuação.",
    reply2: "Toma, usa o meu link de afiliado e ganha 30 dias grátis:",
    snippetSaved: "Snippet · salvo",
    snippetKey: "meu link de afiliado",
    placeholder: "Mensagem",
  },
};

const DURATION = 10000;

type Phase = "initial" | "dictating" | "reply1" | "snippet" | "dictating2" | "reply2";

type SceneState = {
  pill: PillState;
  phase: Phase;
};

const INITIAL: SceneState = { pill: "idle", phase: "initial" };

const VISIBLE = "wa-msg me show";
const HIDDEN = "wa-msg me";

function Check(): React.ReactElement {
  return (
    <span className="wa-check" aria-hidden>
      <svg viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M1 6.5 4 9.5 9.5 3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.5 9.5 13 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function ContactHead({ copy }: { copy: WhatsAppCopy }): React.ReactElement {
  return (
    <div className="wa-head">
      <span className="wa-avatar">{copy.contact.slice(0, 1)}</span>
      <span className="wa-id">
        <span className="wa-name">{copy.contact}</span>
        <span className="wa-status">{copy.status}</span>
      </span>
    </div>
  );
}

function SnippetBubble({ on, copy }: { on: boolean; copy: WhatsAppCopy }): React.ReactElement {
  return (
    <div className={on ? "snippet-bubble on" : "snippet-bubble"}>
      <span className="ico">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </span>
      <div className="txt">
        <div
          style={{
            fontFamily: "var(--font-geist-mono, ui-monospace, monospace)",
            fontSize: "9.5px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--sw-fg-dimmer)",
            marginBottom: "3px",
          }}
        >
          {copy.snippetSaved}
        </div>
        <span className="k">{copy.snippetKey}</span>
        <span className="arrow">→</span>
        <span className="v">{AFFILIATE_URL.slice(0, 20)}…</span>
      </div>
    </div>
  );
}

function ChatInput({ phase, copy }: { phase: Phase; copy: WhatsAppCopy }): React.ReactElement {
  if (phase === "dictating" || phase === "dictating2") {
    return (
      <div className="wa-input dictating">
        <span className="caret" />
      </div>
    );
  }
  return (
    <div className="wa-input">
      <span className="wa-placeholder">{copy.placeholder}</span>
    </div>
  );
}

export function SceneWhatsApp({
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
      { at: 800, run: () => setState({ pill: "transcribing", phase: "dictating" }) },
      { at: 2800, run: () => setState({ pill: "idle", phase: "reply1" }) },
      { at: 4400, run: () => setState({ pill: "idle", phase: "snippet" }) },
      { at: 6400, run: () => setState({ pill: "transcribing", phase: "dictating2" }) },
      { at: 7800, run: () => setState({ pill: "idle", phase: "reply2" }) },
    ],
    DURATION,
    false
  );

  const showReply1 =
    state.phase === "reply1" ||
    state.phase === "snippet" ||
    state.phase === "dictating2" ||
    state.phase === "reply2";
  const showReply2 = state.phase === "reply2";
  const showSnippet = state.phase === "snippet";

  return (
    <Scene>
      <Scene.Frame tall cycle={cycle} duration={DURATION}>
        <AppWindow title="WhatsApp" subtitle={copy.contact}>
          <ContactHead copy={copy} />
          <div className="wa-feed">
            <div className="wa-msg them show">
              <div className="wa-bubble">
                {copy.them}
                <span className="wa-time">14:52</span>
              </div>
            </div>
            <div className={showReply1 ? VISIBLE : HIDDEN}>
              <div className="wa-bubble">
                {copy.reply1}
                <span className="wa-time">
                  14:53
                  <Check />
                </span>
              </div>
            </div>
            <div className={showReply2 ? VISIBLE : HIDDEN}>
              <div className="wa-bubble">
                {copy.reply2}{" "}
                <a className="scene-link" href="#" onClick={(e) => e.preventDefault()}>
                  {AFFILIATE_URL}
                </a>
                <span className="wa-time">
                  14:54
                  <Check />
                </span>
              </div>
            </div>
          </div>
          <ChatInput phase={state.phase} copy={copy} />
        </AppWindow>
        <SnippetBubble on={showSnippet} copy={copy} />
        <Pill state={state.pill} locale={locale} />
      </Scene.Frame>
      <Scene.Meta kicker={kicker} title={title} description={description} />
    </Scene>
  );
}
