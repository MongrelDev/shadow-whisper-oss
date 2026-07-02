"use client";

import { useState } from "react";
import type { Locale } from "~/paraglide/runtime";

import { Scene } from "./scene";
import { Pill } from "./shared/pill";
import { useTimeline } from "./shared/use-timeline";
import { AppWindow, NotesBody } from "./shared/window";

type DiffSegment = { edit: string; after: string };

type DiffCopy = {
  title: string;
  subtitle: string;
  date: string;
  heading: string;
  raw: string;
  segments: readonly DiffSegment[];
  eyebrow: string;
  changed: string;
  before: string;
  after: string;
  reviewPrimary: string;
  reviewSecondary: string;
};

const COPY: Record<Locale, DiffCopy> = {
  en: {
    title: "Notes",
    subtitle: "Calendar",
    date: "Tue · 15:08",
    heading: "Upcoming",
    raw: "meeting with john in new york",
    segments: [
      { edit: "M", after: "eeting with " },
      { edit: "J", after: "ohn in " },
      { edit: "N", after: "ew " },
      { edit: "Y", after: "ork" },
      { edit: ".", after: "" },
    ],
    eyebrow: "Cleanup applied · 5 edits",
    changed: "Here's what changed.",
    before: "Before",
    after: "After",
    reviewPrimary: "Cleanup applied",
    reviewSecondary: "5 edits",
  },
  "pt-BR": {
    title: "Notas",
    subtitle: "Agenda",
    date: "Ter · 15:08",
    heading: "Próximos",
    raw: "reunião com joão em são paulo",
    segments: [
      { edit: "R", after: "eunião com " },
      { edit: "J", after: "oão em " },
      { edit: "S", after: "ão " },
      { edit: "P", after: "aulo" },
      { edit: ".", after: "" },
    ],
    eyebrow: "Limpeza aplicada · 5 edições",
    changed: "Veja o que mudou.",
    before: "Antes",
    after: "Depois",
    reviewPrimary: "Limpeza aplicada",
    reviewSecondary: "5 edições",
  },
};

const DURATION = 8500;

type Phase = "closed" | "open" | "editsRevealed";

function DiffEdits({
  segments,
  revealed,
}: {
  segments: readonly DiffSegment[];
  revealed: boolean;
}): React.ReactElement {
  const cls = revealed ? "edit appear" : "edit";
  return (
    <>
      {segments.map((seg, i) => (
        <span key={i}>
          <span className={cls} style={{ animationDelay: revealed ? `${i * 0.22}s` : "0s" }}>
            {seg.edit}
          </span>
          {seg.after}
        </span>
      ))}
    </>
  );
}

export function SceneDiffView({
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
  const [phase, setPhase] = useState<Phase>("closed");
  const copy = COPY[locale];

  const cycle = useTimeline(
    [
      { at: 0, run: () => setPhase("closed") },
      { at: 600, run: () => setPhase("open") },
      { at: 1400, run: () => setPhase("editsRevealed") },
      { at: 7000, run: () => setPhase("closed") },
    ],
    DURATION,
    false
  );

  const showDiff = phase === "open" || phase === "editsRevealed";

  return (
    <Scene className={showDiff ? "s3 show-diff" : "s3"}>
      <Scene.Frame cycle={cycle} duration={DURATION}>
        <AppWindow title={copy.title} subtitle={copy.subtitle}>
          <NotesBody
            date={copy.date}
            heading={copy.heading}
            bodyStyle={{ color: "var(--sw-fg-dim)" }}
          >
            {copy.raw}
          </NotesBody>
        </AppWindow>

        <div className={showDiff ? "diff-card on" : "diff-card"}>
          <div className="eyebrow">{copy.eyebrow}</div>
          <h4>{copy.changed}</h4>
          <div className="labels">{copy.before}</div>
          <div className="raw">{copy.raw}</div>
          <div className="labels">{copy.after}</div>
          <div className="clean">
            <DiffEdits segments={copy.segments} revealed={phase === "editsRevealed"} />
          </div>
        </div>

        <Pill
          state="review"
          locale={locale}
          reviewPrimary={copy.reviewPrimary}
          reviewSecondary={copy.reviewSecondary}
        />
      </Scene.Frame>
      <Scene.Meta kicker={kicker} title={title} description={description} />
    </Scene>
  );
}
