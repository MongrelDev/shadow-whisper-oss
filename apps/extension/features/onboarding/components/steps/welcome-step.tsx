import { m } from "~/paraglide/messages";

const PREVIEW_ITEMS = [
  { labelKey: m.onboarding_welcome_item_mic, desc: "Permita o microfone para começar a ditar" },
  {
    labelKey: m.onboarding_welcome_item_shortcut,
    desc: "Pressione um atalho para gravar e transcrever",
  },
  { labelKey: m.onboarding_welcome_item_pill, desc: "Transforme texto com skills de IA" },
] as const;

export function WelcomeStep() {
  return (
    <div className="relative flex flex-col gap-8 px-5 py-8">
      {/* Ghosted step number — depth without noise */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 top-0 select-none font-mono text-[128px] font-bold leading-none text-foreground/[0.03]"
      >
        01
      </span>

      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          ShadowWhisper
        </p>
        <h1 className="text-4xl font-bold leading-[1.08] tracking-tight">
          {m.onboarding_welcome_title()}
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {m.onboarding_welcome_subtitle()}
        </p>
      </div>

      {/* What's coming — step preview list with step numbers */}
      <div className="flex flex-col">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          {m.onboarding_welcome_coming_up()}
        </p>
        {PREVIEW_ITEMS.map((item, i) => (
          <div key={item.desc} className="flex items-start gap-4 border-t border-border/50 py-3.5">
            <span className="mt-0.5 shrink-0 font-mono text-[11px] font-medium tabular-nums text-muted-foreground/35">
              {String(i + 2).padStart(2, "0")}
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{item.labelKey()}</span>
              <span className="text-[11px] leading-relaxed text-muted-foreground/60">
                {item.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
