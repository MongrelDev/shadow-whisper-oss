import type { CSSProperties } from "react";
import { fonts, monoStyle } from "../utils/card-styles";

const root: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  position: "relative",
};

const logoMark: CSSProperties = {
  width: 26,
  height: 20,
  borderRadius: 5,
  background: "linear-gradient(135deg, #6b5fd1 0%, #443f8f 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const brandText: CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 11,
  letterSpacing: ".2em",
  textTransform: "uppercase",
  color: "#b8a9f0",
};

const labelChip: CSSProperties = {
  padding: "2px 8px",
  borderRadius: 99,
  marginLeft: 6,
  background: "rgba(255,255,255,.08)",
  border: "1px solid rgba(255,255,255,.1)",
  fontFamily: fonts.mono,
  fontSize: 9.5,
  letterSpacing: ".14em",
  color: "#b8a9f0",
};

const dateText: CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 11,
  color: "rgba(255,255,255,.55)",
  letterSpacing: ".06em",
};

function SWLogoMark() {
  return (
    <div style={logoMark}>
      <svg width="18" height="14" viewBox="0 0 102 80" fill="rgba(255,255,255,.85)">
        <rect x="0" y="28" width="6" height="24" rx="3" />
        <rect x="16" y="20" width="6" height="40" rx="3" />
        <rect x="32" y="0" width="6" height="80" rx="3" />
        <rect x="48" y="28" width="6" height="24" rx="3" />
        <rect x="64" y="11.7" width="6" height="56.6" rx="3" />
        <rect x="80" y="0" width="6" height="80" rx="3" />
        <rect x="96" y="28" width="6" height="24" rx="3" />
      </svg>
    </div>
  );
}

interface CardChromeProps {
  label?: string;
}

export function CardChrome({ label }: CardChromeProps) {
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={root}>
      <SWLogoMark />
      <span style={brandText}>SHADOW WHISPER</span>
      {label && <span style={labelChip}>{label}</span>}
      <span style={{ flex: 1 }} />
      <span style={dateText}>{dateStr}</span>
    </div>
  );
}

export function CardBackdropBars() {
  return (
    <svg
      viewBox="0 0 128 128"
      style={{
        position: "absolute",
        right: -30,
        bottom: -30,
        width: 280,
        height: 280,
        color: "rgba(255,255,255,.06)",
      }}
    >
      <g transform="translate(0,128) scale(0.1,-0.1)" fill="currentColor">
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

interface UserAvatarProps {
  name: string;
  size?: number;
}

function UserAvatar({ name, size = 40 }: UserAvatarProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: "linear-gradient(135deg, #6b5fd1 0%, #443f8f 50%, #2a1f4e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 500,
        fontSize: size * 0.4,
        letterSpacing: "-.02em",
        border: "2px solid rgba(255,255,255,.12)",
        boxShadow: "0 4px 12px -4px rgba(0,0,0,.4)",
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

interface CardUserRowProps {
  name: string;
  subtitle: string;
  avatarSize?: number;
  gap?: number;
  marginTop?: number;
  nameFontSize?: number;
  subtitleFontSize?: number;
}

export function CardUserRow({
  name,
  subtitle,
  avatarSize = 36,
  gap = 12,
  marginTop = 4,
  nameFontSize = 13.5,
  subtitleFontSize = 11,
}: CardUserRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap,
        marginTop,
        position: "relative",
      }}
    >
      <UserAvatar name={name} size={avatarSize} />
      <div>
        <div style={{ fontSize: nameFontSize, fontWeight: 500 }}>{name}</div>
        <div
          style={{
            fontSize: subtitleFontSize,
            color: "rgba(255,255,255,.55)",
            ...monoStyle,
            letterSpacing: ".06em",
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}

export function planLabel(plan: string): string {
  if (plan === "free") return "Gratuito";
  if (plan === "byok") return "BYOK";
  return "Pro";
}

export function FlameIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
