export function SceneSvgDefs(): React.ReactElement {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <symbol id="sw-logo" viewBox="0 0 128 128">
          <g transform="translate(0,128) scale(0.1,-0.1)" fill="currentColor">
            <rect x="130" y="520" width="60" height="240" rx="30" />
            <rect x="290" y="440" width="60" height="400" rx="30" />
            <rect x="450" y="240" width="60" height="800" rx="30" />
            <rect x="610" y="520" width="60" height="240" rx="30" />
            <rect x="770" y="357" width="60" height="566" rx="30" />
            <rect x="930" y="240" width="60" height="800" rx="30" />
            <rect x="1090" y="520" width="60" height="240" rx="30" />
          </g>
        </symbol>
        <symbol id="sw-cursor-arrow" viewBox="0 0 24 24">
          <path
            d="M4 2 L4 20 L9 15.5 L12.5 22 L15 20.5 L11.5 14 L18 13 Z"
            fill="#1c1b2e"
            stroke="#fff"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </symbol>
      </defs>
    </svg>
  );
}

export function SwLogoSvg(): React.ReactElement {
  return (
    <svg viewBox="0 0 128 128">
      <use href="#sw-logo" />
    </svg>
  );
}

export function SwCursorSvg(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24">
      <use href="#sw-cursor-arrow" />
    </svg>
  );
}
