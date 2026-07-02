import { toast } from "sonner";
import type { MilestoneKey } from "@whisper/api";
import { MILESTONE_META, getMilestoneTitle, getMilestoneDesc } from "./milestones";

export const MILESTONE_TOAST_DURATION_MS = 3500;

export function showMilestoneToasts(eventId: string, keys: ReadonlyArray<MilestoneKey>): number {
  for (const key of keys) {
    const id = `${eventId}:${key}`;
    const { Icon, color } = MILESTONE_META[key];
    const title = getMilestoneTitle(key);
    const subtitle = getMilestoneDesc(key);
    const particleBg = color.replace("text-", "bg-");

    toast.custom(
      () => (
        <div className="relative flex items-center gap-3 overflow-visible rounded-md border border-border/60 bg-card px-4 py-3 shadow-lg">
          <MilestoneConfetti particleBg={particleBg} />
          <Icon className={`size-6 shrink-0 ${color}`} aria-hidden strokeWidth={2} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-foreground">{title}</span>
            {subtitle ? (
              <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
            ) : null}
          </div>
        </div>
      ),
      { id, duration: MILESTONE_TOAST_DURATION_MS }
    );
  }
  return keys.length;
}

const PARTICLE_COUNT = 12;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (i % 2 ? 0.18 : -0.12);
  const dist = 26 + (i % 3) * 8;
  return {
    tx: `${Math.round(Math.cos(angle) * dist)}px`,
    ty: `${Math.round(Math.sin(angle) * dist)}px`,
    delay: `${(i % 4) * 30}ms`,
  };
});

function MilestoneConfetti({ particleBg }: { particleBg: string }) {
  return (
    <span className="pointer-events-none absolute inset-0 overflow-visible">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          style={
            {
              position: "absolute",
              top: "50%",
              left: "16px",
              width: 4,
              height: 4,
              borderRadius: 9999,
              animation: `milestone-confetti 900ms ease-out forwards`,
              animationDelay: p.delay,
              "--tx": p.tx,
              "--ty": p.ty,
            } as React.CSSProperties
          }
          className={particleBg}
        />
      ))}
    </span>
  );
}
