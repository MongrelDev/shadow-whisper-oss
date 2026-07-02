import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const MODIFIER_SYMBOLS = new Set(["⌘", "⌃", "⇧", "⌥"]);

const KEY_NAMES: Record<string, string> = {
  "⌘": "Command",
  "⌃": "Control",
  "⇧": "Shift",
  "⌥": "Option",
};

const shortcutVariants = cva(
  "inline-flex items-center rounded-[6px] border font-medium leading-none shadow-[inset_0_1px_0_oklch(1_0_0/0.06)]",
  {
    variants: {
      size: {
        xs: "h-[18px] gap-[3px] px-[5px] text-[10px]",
        sm: "h-5 gap-1 px-1.5 text-[11px]",
      },
      tone: {
        subtle: "border-white/5 bg-white/[0.06]",
        muted: "border-border/50 bg-muted/50",
      },
      textColor: {
        muted: "text-muted-foreground",
        foreground: "text-foreground",
      },
    },
    defaultVariants: {
      size: "xs",
      tone: "subtle",
      textColor: "muted",
    },
  }
);

type PillShortcutChipsProps = VariantProps<typeof shortcutVariants> & {
  keys: string[];
  className?: string;
};

export function shortcutKeysToLabel(keys: string[]): string {
  return keys.map((key) => KEY_NAMES[key] ?? key).join(" + ");
}

function KeyToken({
  value,
  emphasized,
}: {
  value: string;
  emphasized: boolean;
}): React.ReactElement {
  const isModifier = MODIFIER_SYMBOLS.has(value);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center tabular-nums",
        emphasized
          ? "min-w-[13px] rounded-[4px] bg-foreground/10 px-1 py-[2px] text-foreground"
          : "min-w-[10px]",
        isModifier ? "text-[11px]" : "font-mono text-[9px]"
      )}
      style={isModifier ? { fontFamily: "var(--font-keyglyph)", lineHeight: 1 } : undefined}
    >
      {value}
    </span>
  );
}

export function PillShortcutChips({
  keys,
  size,
  tone,
  textColor,
  className,
}: PillShortcutChipsProps): React.ReactElement {
  return (
    <kbd
      className={cn(shortcutVariants({ size, tone, textColor }), className)}
      aria-label={shortcutKeysToLabel(keys)}
      title={shortcutKeysToLabel(keys)}
    >
      {keys.map((key, index) => (
        <span key={`${key}-${index}`} className="inline-flex items-center gap-[3px]">
          {index > 0 ? (
            <span
              className="font-mono text-[8px] leading-none text-muted-foreground/55"
              aria-hidden
            >
              +
            </span>
          ) : null}
          <KeyToken value={key} emphasized={index === keys.length - 1} />
        </span>
      ))}
    </kbd>
  );
}
