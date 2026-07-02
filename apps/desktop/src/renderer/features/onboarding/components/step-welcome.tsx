import { m } from "~/paraglide/messages";

export function StepWelcome(): React.ReactElement {
  const items: Array<{ index: string; text: string; dim?: boolean }> = [
    { index: "01", text: m.onboarding_welcome_item_permissions() },
    { index: "02", text: m.onboarding_welcome_item_shortcut() },
    { index: "03", text: m.onboarding_welcome_item_skills() },
    { index: "04", text: m.onboarding_welcome_item_plan(), dim: true },
  ];

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
        {m.onboarding_welcome_eyebrow()}
      </p>
      <h2 className="mt-2 text-[22px] font-semibold tracking-tight leading-tight text-foreground text-balance max-w-[20ch]">
        {m.onboarding_welcome_title()}
      </h2>
      <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground max-w-[52ch]">
        {m.onboarding_welcome_subtitle()}
      </p>

      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <div key={item.index} className="grid grid-cols-[auto_1fr] gap-3.5 items-center">
            <span
              className={`font-mono text-[11px] min-w-6 ${item.dim ? "text-muted-foreground/60" : "text-primary"}`}
            >
              {item.index}
            </span>
            <span
              className={`text-[13.5px] ${item.dim ? "text-muted-foreground" : "text-foreground"}`}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-6 font-mono text-[11px] tracking-[0.1em] text-muted-foreground/70">
        {m.onboarding_welcome_takes_seconds()}
      </p>
    </div>
  );
}
