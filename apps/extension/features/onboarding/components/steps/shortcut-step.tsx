import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { getShortcutManagementUrl } from "~/lib/browser";
import { m } from "~/paraglide/messages";
import { SceneRecording } from "../scenes/scene-recording";

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded-md border border-border/80 bg-muted px-2 py-1 font-mono text-[11px] font-semibold text-foreground shadow-[0_1px_0_0_hsl(var(--border))] leading-none">
      {children}
    </kbd>
  );
}

export function ShortcutStep() {
  const [copied, setCopied] = useState(false);
  const url = getShortcutManagementUrl();

  function handleCopy() {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative flex flex-col gap-7 px-5 py-8">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 top-0 select-none font-mono text-[128px] font-bold leading-none text-foreground/[0.03]"
      >
        03
      </span>

      <div>
        <h2 className="text-3xl font-bold tracking-tight">{m.onboarding_shortcut_title()}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {m.onboarding_shortcut_body_v2()}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {m.onboarding_scene_recording_heading()}
        </p>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <SceneRecording />
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground/50">
          {m.onboarding_scene_recording_description()}
        </p>
      </div>

      {/* Recording shortcut */}
      <div className="flex flex-col gap-4 border-t border-border/50 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {m.onboarding_shortcut_recording_label()}
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Mac
          </p>
          <div className="flex items-center gap-1.5">
            <Key>⌥</Key>
            <span className="text-xs text-muted-foreground/40">+</span>
            <Key>Space</Key>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Windows · Linux
          </p>
          <div className="flex items-center gap-1.5">
            <Key>Alt</Key>
            <span className="text-xs text-muted-foreground/40">+</span>
            <Key>Shift</Key>
            <span className="text-xs text-muted-foreground/40">+</span>
            <Key>W</Key>
          </div>
        </div>
      </div>

      {/* URL copy */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          {m.onboarding_shortcut_configure_label()}
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 py-1.5 pl-3 pr-1.5">
          <code className="flex-1 truncate font-mono text-[11px] text-muted-foreground">{url}</code>
          <button
            type="button"
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium transition-all hover:bg-accent active:scale-95"
          >
            {copied ? (
              <>
                <Check className="size-3 text-green-500" strokeWidth={2.5} />
                {m.onboarding_shortcut_copied()}
              </>
            ) : (
              <>
                <Copy className="size-3 text-muted-foreground" strokeWidth={1.75} />
                {m.onboarding_shortcut_copy()}
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground/50">
          {m.onboarding_shortcut_url_instruction()}
        </p>
      </div>
    </div>
  );
}
