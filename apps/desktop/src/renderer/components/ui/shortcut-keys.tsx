import { acceleratorToDisplay } from "@/lib/accelerator";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

interface ShortcutKeysProps {
  accelerator?: string;
  keys?: string[];
  className?: string;
}

const MODIFIER_SYMBOLS = new Set(["⌘", "⌃", "⇧", "⌥"]);

const containerVariants = cva("inline-flex items-center", {
  variants: {
    size: {
      sm: "gap-1",
      md: "gap-1",
      lg: "gap-1.5",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const keyVariants = cva("inline-flex items-center justify-center border font-medium", {
  variants: {
    size: {
      sm: "min-w-[24px] h-6 px-1.5 rounded-md text-xs",
      md: "min-w-[28px] h-7 px-2 rounded-lg text-xs",
      lg: "min-w-[32px] h-8 px-2.5 rounded-lg text-sm",
    },
    tone: {
      default: "bg-muted border-border text-muted-foreground",
      inverse: "bg-white text-brand border-white/80",
    },
  },
  defaultVariants: {
    size: "md",
    tone: "default",
  },
});

type ShortcutVariantProps = VariantProps<typeof keyVariants>;

export function ShortcutKeys({
  accelerator,
  keys,
  size = "md",
  tone = "default",
  className,
}: ShortcutKeysProps & ShortcutVariantProps): React.ReactElement {
  const items = keys ?? (accelerator ? acceleratorToDisplay(accelerator) : []);

  return (
    <div className={cn(containerVariants({ size }), className)}>
      {items.map((key, i) => (
        <kbd
          key={`${key}-${i}`}
          className={cn(keyVariants({ size, tone }), "font-mono")}
          style={MODIFIER_SYMBOLS.has(key) ? { fontFamily: "var(--font-keyglyph)" } : undefined}
        >
          {key}
        </kbd>
      ))}
    </div>
  );
}
