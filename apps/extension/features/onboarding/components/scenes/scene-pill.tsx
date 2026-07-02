import { SwLogoSvg } from "./scene-svg";

export type PillState = "idle" | "transcribing" | "processing" | "review";

export function ScenePill({
  state,
  reviewPrimary,
  reviewSecondary,
}: {
  state: PillState;
  reviewPrimary?: string;
  reviewSecondary?: string;
}): React.ReactElement {
  return (
    <div className={`pill ${state}`}>
      <PillContent state={state} reviewPrimary={reviewPrimary} reviewSecondary={reviewSecondary} />
    </div>
  );
}

function PillContent({
  state,
  reviewPrimary,
  reviewSecondary,
}: {
  state: PillState;
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
        <span className="label">Transcribing...</span>
      </>
    );
  }

  if (state === "processing") {
    return (
      <>
        <span className="spinner" />
        <span className="label">Processing...</span>
      </>
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
