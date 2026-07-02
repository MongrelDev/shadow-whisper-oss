"use client";

import { useSyncExternalStore } from "react";
import { Option } from "lucide-react";

import { cn } from "@/lib/utils";

export type DetectedOs = "mac" | "windows" | "linux" | "other";

const OS_TOKENS: ReadonlyArray<{ token: string; os: DetectedOs }> = [
  { token: "mac", os: "mac" },
  { token: "win", os: "windows" },
  { token: "linux", os: "linux" },
];

function readPlatformString(): string {
  if (typeof navigator === "undefined") return "";
  type AgentData = { platform?: string };
  const agent = (navigator as unknown as { userAgentData?: AgentData }).userAgentData;
  return (agent?.platform ?? navigator.platform ?? "").toLowerCase();
}

function detectOs(): DetectedOs {
  const platform = readPlatformString();
  const match = OS_TOKENS.find((m) => platform.includes(m.token));
  return match?.os ?? "other";
}

const noopSubscribe = (): (() => void) => () => {};

export function useDetectedOs(): DetectedOs {
  return useSyncExternalStore<DetectedOs>(noopSubscribe, detectOs, () => "other");
}

function detectHover(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(hover: hover)").matches;
}

export function useHoverDevice(): boolean {
  return useSyncExternalStore<boolean>(noopSubscribe, detectHover, () => false);
}

interface ShortcutKey {
  icon?: typeof Option;
  label: string;
  compactLabel?: string;
}

function getShortcutChipPadding(size: "sm" | "md", variant: "full" | "compact"): string {
  if (variant === "compact") {
    return size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-1.5 py-0.5 text-[11px]";
  }
  return size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]";
}

function getShortcutIconSize(size: "sm" | "md"): string {
  return size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
}

function getShortcutDisplayLabel(keyData: ShortcutKey, variant: "full" | "compact"): string {
  return variant === "compact" ? (keyData.compactLabel ?? keyData.label) : keyData.label;
}

function CompactShortcutContent({ label }: { label: string }): React.ReactElement {
  return <span>{label}</span>;
}

function FullShortcutContent({
  icon: Icon,
  iconSize,
  label,
}: {
  icon?: typeof Option;
  iconSize: string;
  label: string;
}): React.ReactElement {
  return (
    <>
      {Icon ? <Icon aria-hidden="true" className={iconSize} /> : null}
      <span>{label}</span>
    </>
  );
}

function ShortcutKeyChip({
  keyData,
  idx,
  lastIndex,
  size,
  variant,
}: {
  keyData: ShortcutKey;
  idx: number;
  lastIndex: number;
  size: "sm" | "md";
  variant: "full" | "compact";
}): React.ReactElement {
  const Icon = keyData.icon;
  const padding = getShortcutChipPadding(size, variant);
  const iconSize = getShortcutIconSize(size);
  const displayLabel = getShortcutDisplayLabel(keyData, variant);

  return (
    <span key={`${keyData.label}-${idx}`} className="inline-flex items-center">
      <kbd
        aria-label={keyData.label}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-border bg-background font-mono font-medium text-foreground shadow-sm",
          padding
        )}
      >
        {variant === "compact" ? (
          <CompactShortcutContent label={displayLabel} />
        ) : (
          <FullShortcutContent icon={Icon} iconSize={iconSize} label={displayLabel} />
        )}
      </kbd>
      {idx < lastIndex ? (
        <span aria-hidden="true" className="ml-1 text-muted-foreground">
          +
        </span>
      ) : null}
    </span>
  );
}

function shortcutKeysFor(os: DetectedOs): ShortcutKey[] {
  if (os === "mac") {
    return [
      { icon: Option, label: "Option", compactLabel: "⌥" },
      { label: "Space", compactLabel: "Space" },
    ];
  }
  return [
    { label: "Ctrl", compactLabel: "Ctrl" },
    { label: "Shift", compactLabel: "Shift" },
    { label: "Space", compactLabel: "Space" },
  ];
}

export function ShortcutChips({
  os,
  size = "md",
  variant = "full",
}: {
  os: DetectedOs;
  size?: "sm" | "md";
  variant?: "full" | "compact";
}): React.ReactElement {
  const keys = shortcutKeysFor(os);
  return (
    <div className="inline-flex flex-wrap items-center gap-1">
      {keys.map((keyData, idx) => (
        <ShortcutKeyChip
          key={`${keyData.label}-${idx}`}
          keyData={keyData}
          idx={idx}
          lastIndex={keys.length - 1}
          size={size}
          variant={variant}
        />
      ))}
    </div>
  );
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
