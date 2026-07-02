import type { Locale } from "~/paraglide/runtime";

import { SwLogoSvg } from "./svg-defs";

export type PillState = "idle" | "transcribing" | "processing" | "review";

const TRANSCRIBING_LABEL: Record<Locale, string> = {
  en: "Transcribing…",
  "pt-BR": "Transcrevendo…",
};

export function Pill({
  state,
  locale,
  reviewPrimary,
  reviewSecondary,
}: {
  state: PillState;
  locale: Locale;
  reviewPrimary?: string;
  reviewSecondary?: string;
}): React.ReactElement {
  return (
    <div className={`pill ${state}`}>
      <PillInner
        state={state}
        locale={locale}
        reviewPrimary={reviewPrimary}
        reviewSecondary={reviewSecondary}
      />
    </div>
  );
}

function PillInner({
  state,
  locale,
  reviewPrimary,
  reviewSecondary,
}: {
  state: PillState;
  locale: Locale;
  reviewPrimary?: string;
  reviewSecondary?: string;
}): React.ReactElement {
  if (state === "idle") {
    return (
      <span className="logo">
        <SwLogoSvg />
      </span>
    );
  }

  if (state === "transcribing") {
    return (
      <>
        <span className="logo">
          <SwLogoSvg />
        </span>
        <span className="bars">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} />
          ))}
        </span>
        <span className="label">{TRANSCRIBING_LABEL[locale]}</span>
      </>
    );
  }

  if (state === "processing") {
    return (
      <span className="dots" aria-hidden>
        <span />
        <span />
        <span />
      </span>
    );
  }

  return (
    <>
      <span className="dot" />
      <span
        className="label"
        style={{
          fontFamily: "inherit",
          fontSize: "11.5px",
          letterSpacing: "-0.005em",
          color: "var(--sw-fg)",
        }}
      >
        {reviewPrimary}
      </span>
      <span className="sep" />
      <span className="label">{reviewSecondary}</span>
    </>
  );
}
