"use client";

import { cn } from "@/lib/utils";

import "./scenes.css";

type SceneVariant = "default" | "wide";

function SceneRoot({
  paused = false,
  className,
  children,
}: {
  variant?: SceneVariant;
  paused?: boolean;
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <article
      className={cn(
        "sw-scene flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card",
        paused && "paused",
        className
      )}
    >
      {children}
    </article>
  );
}

function SceneProgress({
  cycle,
  duration,
}: {
  cycle?: number;
  duration?: number;
}): React.ReactElement | null {
  if (duration === undefined) return null;
  return (
    <div className="scene-progress" aria-hidden="true">
      <span key={cycle ?? 0} className="bar" style={{ animationDuration: `${duration}ms` }} />
    </div>
  );
}

function SceneStage({
  cycle,
  children,
}: {
  cycle?: number;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div key={cycle ?? 0} className={cn("app", cycle !== undefined && "cycle-in")}>
      {children}
    </div>
  );
}

function SceneFrame({
  variant = "default",
  tall = false,
  extraClass,
  cycle,
  duration,
  children,
}: {
  variant?: SceneVariant;
  tall?: boolean;
  extraClass?: string;
  cycle?: number;
  duration?: number;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={cn("frame", variant === "wide" && "wide", tall && "tall", extraClass)}>
      <SceneProgress cycle={cycle} duration={duration} />
      <SceneStage cycle={cycle}>{children}</SceneStage>
    </div>
  );
}

function SceneMeta({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}): React.ReactElement {
  return (
    <div className="px-6 pb-6 pt-5.5">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">{kicker}</p>
      <h3 className="mt-2.5 text-xl font-semibold leading-[1.25] tracking-[-0.015em]">{title}</h3>
      <p className="mt-3 text-sm leading-[1.7] text-muted-foreground">{description}</p>
    </div>
  );
}

export const Scene = Object.assign(SceneRoot, {
  Frame: SceneFrame,
  Meta: SceneMeta,
});
