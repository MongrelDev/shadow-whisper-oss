import { Mic } from "lucide-react";
import { m } from "~/paraglide/messages";

export function MicrophoneStep() {
  return (
    <div className="relative flex flex-col gap-7 px-5 py-8">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 top-0 select-none font-mono text-[128px] font-bold leading-none text-foreground/[0.03]"
      >
        02
      </span>

      <div>
        <h2 className="text-3xl font-bold tracking-tight">{m.onboarding_microphone_title()}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {m.onboarding_microphone_body()}
        </p>
      </div>

      {/* Browser permission dialog — realistic Chrome-style */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/30 px-3 py-2.5">
          <div className="size-2.5 rounded-full bg-destructive/50" />
          <div className="size-2.5 rounded-full bg-yellow-500/35" />
          <div className="size-2.5 rounded-full bg-green-500/35" />
          <div className="ml-auto flex items-center gap-1 rounded-md bg-background/60 px-2.5 py-1">
            <span className="text-[9px] text-muted-foreground/50">shadowwhisper.com</span>
          </div>
        </div>

        {/* Dialog content */}
        <div className="flex flex-col items-center gap-4 px-5 py-6">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Mic className="size-5 text-primary" strokeWidth={1.75} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">{m.onboarding_microphone_prompt()}</p>
          </div>
          {/* Buttons — non-interactive, illustrative only */}
          <div className="flex w-full gap-2 select-none" aria-hidden>
            <button
              type="button"
              tabIndex={-1}
              className="pointer-events-none flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium opacity-50"
            >
              {m.onboarding_microphone_block()}
            </button>
            <button
              type="button"
              tabIndex={-1}
              className="pointer-events-none flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground opacity-50"
            >
              {m.onboarding_microphone_allow()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
