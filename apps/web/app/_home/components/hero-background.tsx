export function HeroBackground(): React.ReactElement {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--color-primary)_12%,transparent)_0%,transparent_70%)]" />

      <svg className="absolute inset-0 h-full w-full text-foreground opacity-[0.045] [mask-image:radial-gradient(60%_60%_at_50%_35%,#000_0%,transparent_80%)]">
        <defs>
          <pattern id="hero-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M 56 0 L 0 0 0 56" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center opacity-[0.45] [mask-image:radial-gradient(70%_60%_at_50%_55%,#000_0%,transparent_85%)]">
        <svg
          viewBox="0 0 1400 280"
          preserveAspectRatio="none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          className="h-auto w-[140%] text-[color-mix(in_oklch,var(--color-primary)_55%,white)]"
        >
          <g opacity="0.85">
            <path d="M0,140 C120,60 220,220 360,140 C500,60 600,220 740,140 C880,60 980,220 1120,140 C1260,60 1360,220 1400,140" />
            <path
              d="M0,140 C120,90 220,190 360,140 C500,90 600,190 740,140 C880,90 980,190 1120,140 C1260,90 1360,190 1400,140"
              opacity="0.8"
            />
            <path
              d="M0,140 C120,115 220,165 360,140 C500,115 600,165 740,140 C880,115 980,165 1120,140 C1260,115 1360,165 1400,140"
              opacity="0.55"
            />
            <path
              d="M0,140 C120,30 220,250 360,140 C500,30 600,250 740,140 C880,30 980,250 1120,140 C1260,30 1360,250 1400,140"
              opacity="0.35"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
