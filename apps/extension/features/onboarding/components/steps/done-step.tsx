import { CircleCheck } from "lucide-react";
import { m } from "~/paraglide/messages";

export function DoneStep() {
  return (
    <div className="relative flex flex-col justify-center gap-8 px-5 py-10">
      {/* Ghosted number — in primary color for the finale */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 top-0 select-none font-mono text-[128px] font-bold leading-none text-primary/[0.07]"
      >
        05
      </span>

      {/* Checkmark */}
      <div className="flex justify-start">
        <div className="relative flex size-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/10" />
          <div className="absolute inset-2 rounded-full bg-primary/5" />
          <CircleCheck className="relative size-8 text-primary" strokeWidth={1.5} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-bold leading-[1.08] tracking-tight">
          {m.onboarding_done_title()}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {m.onboarding_done_subtitle()}
        </p>
      </div>
    </div>
  );
}
