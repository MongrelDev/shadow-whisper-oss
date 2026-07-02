"use client";

import { useState } from "react";
import type { Locale } from "~/paraglide/runtime";

import { Scene } from "./scene";
import { Pill, type PillState } from "./shared/pill";
import { useTimeline } from "./shared/use-timeline";
import { AppWindow } from "./shared/window";

const AFFILIATE_URL = "https://app.shadowwhisper.com/?ref=mongrel";

type SnippetCopy = {
  channel: string;
  members: string;
  fullReply: string;
  them: string;
  themName: string;
  meName: string;
  snippetSaved: string;
  snippetKey: string;
  placeholder: string;
};

const COPY: Record<Locale, SnippetCopy> = {
  en: {
    channel: "launch-chat",
    members: "7 members",
    fullReply:
      "That's awesome! If you are going to test the tool, use my affiliate link and get 30 days of free usage:",
    them: "Is the tool worth it? Thinking about the trial this weekend.",
    themName: "Dana",
    meName: "You",
    snippetSaved: "Snippet · saved",
    snippetKey: "my affiliate link",
    placeholder: "Message #launch-chat",
  },
  "pt-BR": {
    channel: "lançamento",
    members: "7 membros",
    fullReply:
      "Vale muito! Se você for testar a ferramenta, usa o meu link de afiliado e ganha 30 dias grátis:",
    them: "Vale a pena a ferramenta? Pensando em testar no fim de semana.",
    themName: "Dana",
    meName: "Você",
    snippetSaved: "Snippet · salvo",
    snippetKey: "meu link de afiliado",
    placeholder: "Mensagem #lançamento",
  },
};

const DURATION = 10000;

type Phase = "initial" | "snippetShown" | "snippetHidden" | "dictating" | "expanded" | "sent";

type SceneState = {
  pill: PillState;
  phase: Phase;
};

const INITIAL: SceneState = { pill: "idle", phase: "initial" };

function ChatHeader({ copy }: { copy: SnippetCopy }): React.ReactElement {
  return (
    <div className="chat-head">
      <span className="hash">#</span>
      <span className="ch">{copy.channel}</span>
      <span className="chmeta">{copy.members}</span>
    </div>
  );
}

function IncomingMessage({ copy }: { copy: SnippetCopy }): React.ReactElement {
  return (
    <div className="msg them">
      <div className="avatar">DN</div>
      <div>
        <span className="name">{copy.themName}</span>
        <span className="time">14:52</span>
        <div className="bubble">{copy.them}</div>
      </div>
    </div>
  );
}

function ReplyMessage({ show, copy }: { show: boolean; copy: SnippetCopy }): React.ReactElement {
  return (
    <div className="msg" style={{ opacity: show ? 1 : 0, transition: "opacity .4s ease" }}>
      <div className="avatar">ME</div>
      <div>
        <span className="name">{copy.meName}</span>
        <span className="time">14:53</span>
        <div className="bubble">
          {copy.fullReply}{" "}
          <a className="scene-link" href="#" onClick={(e) => e.preventDefault()}>
            {AFFILIATE_URL}
          </a>
        </div>
      </div>
    </div>
  );
}

function SnippetBubble({ on, copy }: { on: boolean; copy: SnippetCopy }): React.ReactElement {
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

function ChatInput({ phase, copy }: { phase: Phase; copy: SnippetCopy }): React.ReactElement {
  if (phase === "dictating") {
    return (
      <div className="chat-input">
        <span className="caret" />
      </div>
    );
  }
  if (phase === "expanded") {
    return (
      <div className="chat-input">
        <span style={{ color: "var(--sw-fg)" }}>
          {copy.fullReply} <span style={{ color: "var(--sw-primary-soft)" }}>{AFFILIATE_URL}</span>
        </span>
        <span className="caret" />
      </div>
    );
  }
  return (
    <div className="chat-input">
      <span style={{ color: "var(--sw-fg-dim)" }}>{copy.placeholder}</span>
    </div>
  );
}

export function SceneSnippets({
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
      { at: 700, run: () => setState({ pill: "idle", phase: "snippetShown" }) },
      { at: 3000, run: () => setState({ pill: "idle", phase: "snippetHidden" }) },
      { at: 3400, run: () => setState({ pill: "transcribing", phase: "dictating" }) },
      { at: 5500, run: () => setState({ pill: "transcribing", phase: "expanded" }) },
      { at: 6600, run: () => setState({ pill: "idle", phase: "sent" }) },
    ],
    DURATION,
    false
  );

  const showReply = state.phase === "sent";
  const showSnippet = state.phase === "snippetShown";

  return (
    <Scene variant="wide">
      <Scene.Frame variant="wide" tall cycle={cycle} duration={DURATION}>
        <AppWindow title="Slack" subtitle={`#${copy.channel}`}>
          <ChatHeader copy={copy} />
          <div className="chat-feed">
            <IncomingMessage copy={copy} />
            <ReplyMessage show={showReply} copy={copy} />
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
