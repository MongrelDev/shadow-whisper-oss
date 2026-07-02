import { useState } from "react";

import { cn } from "@/lib/utils";

import { useTimeline } from "./use-timeline";
import "./scenes.css";

const ORIGINAL_TEXT =
  "Precisamos revisar o documento antes de enviar para o cliente na sexta-feira.";
const TRANSLATED_TEXT = "We need to review the document before sending it to the client on Friday.";

const DURATION = 11000;

type Step = "idle" | "selected" | "shortcut" | "processing" | "done";

type SceneState = {
  step: Step;
  cursor: { left: string; top: string };
  showToast: boolean;
};

const INITIAL: SceneState = {
  step: "idle",
  cursor: { left: "75%", top: "72%" },
  showToast: false,
};

const SELECTED_STEPS = new Set<Step>(["selected", "shortcut", "processing"]);

function SwTrayIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <g transform="translate(0,128) scale(0.1,-0.1)">
        <rect x="130" y="520" width="60" height="240" rx="30" />
        <rect x="290" y="440" width="60" height="400" rx="30" />
        <rect x="450" y="240" width="60" height="800" rx="30" />
        <rect x="610" y="520" width="60" height="240" rx="30" />
        <rect x="770" y="357" width="60" height="566" rx="30" />
        <rect x="930" y="240" width="60" height="800" rx="30" />
        <rect x="1090" y="520" width="60" height="240" rx="30" />
      </g>
    </svg>
  );
}

function MenuBar({ active }: { active: boolean }): React.ReactElement {
  return (
    <div className="menubar">
      <span className="menubar-item" style={{ fontWeight: 600 }}>
        Notes
      </span>
      <span className="menubar-item">File</span>
      <span className="menubar-item">Edit</span>
      <div className="menubar-right">
        <span className={cn("tray-icon", active && "active")}>
          <SwTrayIcon />
        </span>
        <span>12:34</span>
      </div>
    </div>
  );
}

function EditorBody({ step }: { step: Step }): React.ReactElement {
  if (step === "done") {
    return <>{TRANSLATED_TEXT}</>;
  }
  if (SELECTED_STEPS.has(step)) {
    return <span className="selection">{ORIGINAL_TEXT}</span>;
  }
  return <>{ORIGINAL_TEXT}</>;
}

function SceneCursor({ left, top }: { left: string; top: string }): React.ReactElement {
  return (
    <div className="cursor" style={{ left, top }}>
      <svg viewBox="0 0 24 24">
        <path
          d="M4 2 L4 20 L9 15.5 L12.5 22 L15 20.5 L11.5 14 L18 13 Z"
          fill="#fff"
          stroke="#0a0a12"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function KbdBadge({ visible }: { visible: boolean }): React.ReactElement {
  return (
    <div className={cn("kbd-badge", visible && "on")} style={{ left: "50%", top: "30%" }}>
      <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>T</kbd>
    </div>
  );
}

function SceneToast({ visible }: { visible: boolean }): React.ReactElement {
  return (
    <div className={cn("scene-toast", visible && "on")}>
      <span className="scene-toast-icon">✓</span>
      Skill applied
    </div>
  );
}

export function SceneSkill(): React.ReactElement {
  const [state, setState] = useState<SceneState>(INITIAL);

  useTimeline(
    [
      { at: 0, run: () => setState(INITIAL) },
      {
        at: 400,
        run: () => setState((s) => ({ ...s, cursor: { left: "8%", top: "52%" } })),
      },
      { at: 1400, run: () => setState((s) => ({ ...s, step: "selected" })) },
      {
        at: 2400,
        run: () =>
          setState((s) => ({
            ...s,
            step: "shortcut",
            cursor: { left: "60%", top: "52%" },
          })),
      },
      {
        at: 4000,
        run: () => setState((s) => ({ ...s, step: "processing" })),
      },
      {
        at: 6000,
        run: () => setState((s) => ({ ...s, step: "done", showToast: true })),
      },
      {
        at: 9000,
        run: () => setState((s) => ({ ...s, showToast: false })),
      },
    ],
    DURATION,
    false
  );

  const isProcessing = state.step === "processing";

  return (
    <article className="sw-scene">
      <div className="frame">
        <div className="app">
          <MenuBar active={isProcessing} />
          <div className="win" style={{ top: 32, left: 10, right: 10, bottom: 10 }}>
            <div className="titlebar">
              <div className="lights">
                <span className="c1" />
                <span className="c2" />
                <span className="c3" />
              </div>
              <div className="title">
                Notes
                <span className="dot" />
                Draft
              </div>
            </div>
            <div className="editor-body">
              <div className="heading">Client Brief</div>
              <div className="body">
                <EditorBody step={state.step} />
              </div>
            </div>
          </div>
          <SceneCursor left={state.cursor.left} top={state.cursor.top} />
          <KbdBadge visible={state.step === "shortcut"} />
          <SceneToast visible={state.showToast} />
        </div>
      </div>
    </article>
  );
}
