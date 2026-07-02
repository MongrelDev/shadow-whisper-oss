"use client";

import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

interface TryItOverlayProps {
  locale: Locale;
  onDismiss: () => void;
}

export function TryItOverlay({ locale, onDismiss }: TryItOverlayProps): React.ReactElement {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm">
      <div className="flex max-w-sm flex-col items-center gap-4 px-6 text-center">
        <h3 className="text-lg font-semibold text-foreground">
          {m.home_demo_overlay_title({}, { locale })}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {m.home_demo_overlay_body({}, { locale })}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex h-9 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {m.home_demo_overlay_cta({}, { locale })}
        </button>
      </div>
    </div>
  );
}
