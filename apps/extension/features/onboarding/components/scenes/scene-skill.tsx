import { useState } from "react";

import { cn } from "~/lib/utils";

import { AppWindow, NotesBody, SceneFrame } from "./scene-frame";
import { ScenePill, type PillState } from "./scene-pill";
import { useTimeline } from "./use-timeline";

const ORIGINAL_TEXT =
  "Precisamos revisar o documento antes de enviar para o cliente na sexta-feira.";
const TRANSLATED_TEXT = "We need to review the document before sending it to the client on Friday.";

const SKILLS = [
  { id: "translate", label: "Translate to English" },
  { id: "summarize", label: "Summarize" },
  { id: "formal", label: "Make Formal" },
] as const;

const DURATION = 12000;

type SkillStep =
  | "idle"
  | "selected"
  | "right-click"
  | "context-menu"
  | "hover-sw"
  | "submenu"
  | "picked"
  | "processing"
  | "done";

type SkillState = {
  pill: PillState;
  step: SkillStep;
  activeSkill: number;
  cursor: { left: string; top: string };
};

const INITIAL: SkillState = {
  pill: "idle",
  step: "idle",
  activeSkill: -1,
  cursor: { left: "70%", top: "75%" },
};

const SELECTED_STEPS = new Set<SkillStep>([
  "selected",
  "right-click",
  "context-menu",
  "hover-sw",
  "submenu",
  "picked",
  "processing",
]);

function SkillBody({ step }: { step: SkillStep }): React.ReactElement {
  if (step === "done") {
    return <>{TRANSLATED_TEXT}</>;
  }

  if (SELECTED_STEPS.has(step)) {
    return <span className="selection">{ORIGINAL_TEXT}</span>;
  }

  return <>{ORIGINAL_TEXT}</>;
}

function ContextMenu({
  visible,
  hoverSw,
}: {
  visible: boolean;
  hoverSw: boolean;
}): React.ReactElement {
  return (
    <div className={cn("ctx-menu", visible && "on")} style={{ left: "10%", top: "50%" }}>
      <div className={cn("ctx-item sw-parent", hoverSw && "active")}>
        Shadow Whisper
        <span className="ctx-arrow">›</span>
      </div>
    </div>
  );
}

function SkillSubmenu({
  visible,
  activeIndex,
}: {
  visible: boolean;
  activeIndex: number;
}): React.ReactElement {
  return (
    <div className={cn("ctx-menu sub", visible && "on")} style={{ left: "43%", top: "52%" }}>
      {SKILLS.map((skill, i) => (
        <div key={skill.id} className={cn("ctx-item", i === activeIndex && "active")}>
          {skill.label}
        </div>
      ))}
      <div className="ctx-sep" />
      <div className="ctx-item dim">Paste last transcript</div>
    </div>
  );
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

const CONTEXT_MENU_STEPS = new Set<SkillStep>(["context-menu", "hover-sw", "submenu", "picked"]);
const HOVER_SW_STEPS = new Set<SkillStep>(["hover-sw", "submenu", "picked"]);
const SUBMENU_STEPS = new Set<SkillStep>(["submenu", "picked"]);

function deriveMenuVisibility(step: SkillStep) {
  return {
    showContextMenu: CONTEXT_MENU_STEPS.has(step),
    hoverSw: HOVER_SW_STEPS.has(step),
    showSubmenu: SUBMENU_STEPS.has(step),
  };
}

export function SceneSkill(): React.ReactElement {
  const [state, setState] = useState<SkillState>(INITIAL);

  useTimeline(
    [
      { at: 0, run: () => setState(INITIAL) },
      {
        at: 400,
        run: () => setState((s) => ({ ...s, cursor: { left: "10%", top: "38%" } })),
      },
      { at: 1400, run: () => setState((s) => ({ ...s, step: "selected" })) },
      {
        at: 2200,
        run: () =>
          setState((s) => ({
            ...s,
            step: "right-click",
            cursor: { left: "30%", top: "44%" },
          })),
      },
      { at: 3000, run: () => setState((s) => ({ ...s, step: "context-menu" })) },
      {
        at: 3800,
        run: () =>
          setState((s) => ({
            ...s,
            step: "hover-sw",
            cursor: { left: "22%", top: "54%" },
          })),
      },
      {
        at: 4600,
        run: () =>
          setState((s) => ({
            ...s,
            step: "submenu",
            cursor: { left: "50%", top: "54%" },
          })),
      },
      {
        at: 5400,
        run: () =>
          setState((s) => ({
            ...s,
            step: "picked",
            activeSkill: 0,
            cursor: { left: "55%", top: "54%" },
          })),
      },
      {
        at: 6200,
        run: () =>
          setState((s) => ({
            ...s,
            step: "processing",
            pill: "processing",
            activeSkill: -1,
          })),
      },
      {
        at: 8200,
        run: () =>
          setState((s) => ({
            ...s,
            step: "done",
            pill: "review",
          })),
      },
      {
        at: 10500,
        run: () => setState((s) => ({ ...s, pill: "idle" })),
      },
    ],
    DURATION,
    false
  );

  const { showContextMenu, hoverSw, showSubmenu } = deriveMenuVisibility(state.step);

  return (
    <SceneFrame>
      <AppWindow title="Docs" subtitle="Draft">
        <NotesBody heading="Client Brief">
          <SkillBody step={state.step} />
        </NotesBody>
      </AppWindow>
      <SceneCursor left={state.cursor.left} top={state.cursor.top} />
      <ContextMenu visible={showContextMenu} hoverSw={hoverSw} />
      <SkillSubmenu visible={showSubmenu} activeIndex={state.activeSkill} />
      <ScenePill state={state.pill} reviewPrimary="Copied" reviewSecondary="Ctrl+V to paste" />
    </SceneFrame>
  );
}
