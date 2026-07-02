export function SwLogoSvg(): React.ReactElement {
  return (
    <svg viewBox="0 0 128 128" fill="currentColor" aria-hidden="true">
      <g transform="translate(0,128) scale(0.1,-0.1)">
        <rect x="130" y="520" width="60" height="240" rx="30" />
        <rect x="290" y="440" width="60" height="400" rx="30" />
        <rect x="450" y="240" width="60" height="800" rx="30" />
        <rect x="610" y="520" width="60" height="240" rx="30" />
        <rect x="770" y="357" width="60" height="566" rx="30" />
        <rect x="930" y="240" width="60" height="800" rx="30" />
        <rect x="1090" y="520" width="60" height="240" rx="30" />
      </g>
    </svg>
  );
}

export function SwCursorSvg(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 2 L4 20 L9 15.5 L12.5 22 L15 20.5 L11.5 14 L18 13 Z"
        fill="#fff"
        stroke="#0a0a12"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
