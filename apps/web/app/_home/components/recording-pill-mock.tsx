const barHeights = [40, 75, 55, 90, 30, 68, 50, 82, 42];
const barDelays = [-0.2, -0.05, -0.3, -0.1, -0.4, -0.15, -0.25, 0, -0.35];

export function RecordingPillMock(): React.ReactElement {
  return (
    <div className="relative mt-20 flex justify-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-10 -inset-x-28 -z-10 bg-[radial-gradient(60%_100%_at_50%_50%,color-mix(in_oklch,var(--color-primary)_14%,transparent),transparent_70%)] blur-lg"
      />

      <div className="rounded-full bg-[#18182b] dark:bg-[#18182b]">
        <div className="inline-flex items-center gap-3.5 rounded-full border border-white/[0.06] px-4 py-3 text-white shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_20px_48px_-20px_rgba(24,24,43,0.65),0_2px_0_rgba(24,24,43,0.12)]">
          <span className="relative flex size-2.5 items-center justify-center" aria-hidden="true">
            <span className="recording-pulse absolute inset-0 rounded-full bg-[#e14949]" />
            <span className="relative size-2.5 rounded-full bg-[#e14949]" />
          </span>

          <span className="inline-flex h-5 items-center gap-[3px]" aria-hidden="true">
            {barHeights.map((height, i) => (
              <span
                key={i}
                className="recording-wave-bar inline-block w-[2.5px] rounded-[2px] bg-[#d7d3ff]"
                style={{
                  height: `${height}%`,
                  animationDelay: `${barDelays[i]}s`,
                }}
              />
            ))}
          </span>

          <span className="font-mono text-xs tracking-[0.04em] text-[#cdd0e1] tabular-nums">
            00:04
          </span>

          <span className="inline-flex items-center gap-1 border-l border-white/10 pl-2.5 font-mono text-[11px] text-[#9a9bb1]">
            <Kbd>⌘</Kbd>
            <Kbd>⇧</Kbd>
            <Kbd>⌥</Kbd>
            <Kbd>W</Kbd>
          </span>
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <kbd className="rounded border border-white/[0.08] bg-white/[0.07] px-1.5 py-px font-mono text-[11px] text-[#e7e9f5]">
      {children}
    </kbd>
  );
}
