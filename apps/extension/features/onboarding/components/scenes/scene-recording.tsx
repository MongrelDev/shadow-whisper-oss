import { useEffect, useRef, useState } from "react";

import { AppWindow, Caret, NotesBody, SceneFrame } from "./scene-frame";
import { ScenePill, type PillState } from "./scene-pill";
import { useTimeline } from "./use-timeline";

const TYPED_TEXT =
  "Meeting notes: discuss the new design system and finalize the color palette before Friday.";
const DURATION = 9000;

type RecordingStep = "idle" | "transcribing" | "processing" | "typing" | "done";

type RecordingState = {
  pill: PillState;
  step: RecordingStep;
  visibleChars: number;
};

const INITIAL: RecordingState = {
  pill: "idle",
  step: "idle",
  visibleChars: 0,
};

function RecordingBody({
  step,
  visibleChars,
}: {
  step: RecordingStep;
  visibleChars: number;
}): React.ReactElement {
  if (step === "typing" || step === "done") {
    return (
      <span>
        {TYPED_TEXT.slice(0, visibleChars)}
        {step === "typing" && <Caret />}
      </span>
    );
  }

  return (
    <span>
      <Caret />
    </span>
  );
}

export function SceneRecording(): React.ReactElement {
  const [state, setState] = useState<RecordingState>(INITIAL);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useTimeline(
    [
      { at: 0, run: () => setState(INITIAL) },
      {
        at: 600,
        run: () => setState((s) => ({ ...s, pill: "transcribing", step: "transcribing" })),
      },
      {
        at: 2200,
        run: () => setState((s) => ({ ...s, pill: "processing", step: "processing" })),
      },
      {
        at: 3400,
        run: () => setState((s) => ({ ...s, pill: "idle", step: "typing" })),
      },
      {
        at: 7200,
        run: () =>
          setState((s) => ({
            ...s,
            step: "done",
            visibleChars: TYPED_TEXT.length,
          })),
      },
    ],
    DURATION,
    false
  );

  useEffect(() => {
    if (state.step !== "typing") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setState((s) => {
        if (s.visibleChars >= TYPED_TEXT.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return s;
        }
        return { ...s, visibleChars: s.visibleChars + 1 };
      });
    }, 35);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.step]);

  return (
    <SceneFrame>
      <AppWindow title="Docs" subtitle="Notes">
        <NotesBody heading="Meeting Notes">
          <RecordingBody step={state.step} visibleChars={state.visibleChars} />
        </NotesBody>
      </AppWindow>
      <ScenePill state={state.pill} />
    </SceneFrame>
  );
}
