import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cva } from "class-variance-authority";
import { m } from "~/paraglide/messages";
import { AppLogo } from "@/components/app-logo";
import { acceleratorToDisplay } from "@/lib/accelerator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PillShortcutChips, shortcutKeysToLabel } from "./pill-shortcut-chips";

const GRACING_PADDING = 6;
const COLLAPSE_GRACE_MS = 300;

const MINIMIZED_BAR_WIDTH = 42;
const MINIMIZED_BAR_HEIGHT = 6;

type PillState = "collapsed" | "expanded" | "limit";

function computeState({
  isExpanded,
  isLimitReached,
}: {
  isExpanded: boolean;
  isLimitReached: boolean;
}): PillState {
  if (isLimitReached) return "limit";
  return isExpanded ? "expanded" : "collapsed";
}

const pillChrome = cva(
  "relative flex items-center overflow-hidden rounded-full border cursor-pointer transition-[border-color,box-shadow,background-color,opacity,padding] duration-200",
  {
    variants: {
      state: {
        collapsed: "",
        expanded: "h-8 gap-1.5 px-2.5 opacity-100 border-border/60 bg-card",
        limit: "h-8 gap-1.5 px-2.5 opacity-100 border-border/60 bg-card",
      },
    },
  }
);

function shortcutTooltip(shortcutKeys: string[]): string {
  if (shortcutKeys.length === 0) return m.pill_hover_say_it_label();
  return m.pill_shortcut_start_tooltip({ shortcut: shortcutKeysToLabel(shortcutKeys) });
}

function ExpandedView({ shortcutKeys }: { shortcutKeys: string[] }): React.ReactElement {
  return (
    <motion.span
      key="expanded"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.16 }}
      className="flex items-center gap-2"
    >
      <AppLogo className="size-3 text-primary" />
      {shortcutKeys.length > 0 ? (
        <PillShortcutChips keys={shortcutKeys} size="xs" tone="subtle" textColor="muted" />
      ) : null}
    </motion.span>
  );
}

function LimitView(): React.ReactElement {
  return (
    <motion.span
      key="limit"
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
      transition={{ duration: 0.14 }}
      className="flex items-center gap-1.5"
    >
      <span className="inline-flex size-3.5 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <AppLogo className="size-2 text-primary" />
      </span>
      <span className="whitespace-nowrap text-[10.5px] font-medium text-foreground">
        {m.pill_minimized_limit_label()}
      </span>
    </motion.span>
  );
}

function ExpandedScene({
  state,
  shortcutKeys,
}: {
  state: PillState;
  shortcutKeys: string[];
}): React.ReactElement {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {state === "limit" ? <LimitView /> : <ExpandedView shortcutKeys={shortcutKeys} />}
    </AnimatePresence>
  );
}

function CollapsedPill({
  shortcutKeys,
  onExpand,
}: {
  shortcutKeys: string[];
  onExpand: () => void;
}): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, y: 6 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-center"
      style={{ padding: GRACING_PADDING }}
      onMouseEnter={onExpand}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="bg-background/50 border border-border/60 backdrop-blur-sm rounded-full relative before:absolute before:-inset-3 before:content-[''] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ width: MINIMIZED_BAR_WIDTH, height: MINIMIZED_BAR_HEIGHT }}
            onFocus={onExpand}
            aria-label={shortcutTooltip(shortcutKeys)}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-none whitespace-nowrap">
          {shortcutTooltip(shortcutKeys)}
        </TooltipContent>
      </Tooltip>
    </motion.div>
  );
}

function ExpandedPill({
  state,
  shortcutKeys,
  isLimitReached,
  onUpgrade,
  onMouseLeave,
}: {
  state: PillState;
  shortcutKeys: string[];
  isLimitReached: boolean;
  onUpgrade: () => void;
  onMouseLeave: () => void;
}): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, y: 6 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-center"
      style={{ padding: GRACING_PADDING }}
      onMouseLeave={onMouseLeave}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            type="button"
            onClick={isLimitReached ? onUpgrade : undefined}
            className={pillChrome({ state })}
            layout
            initial={false}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.97 }}
            aria-label={
              state === "limit" ? m.pill_minimized_limit_label() : shortcutTooltip(shortcutKeys)
            }
          >
            <ExpandedScene state={state} shortcutKeys={shortcutKeys} />
          </motion.button>
        </TooltipTrigger>
        {state === "limit" ? null : (
          <TooltipContent side="top" className="max-w-none whitespace-nowrap">
            {shortcutTooltip(shortcutKeys)}
          </TooltipContent>
        )}
      </Tooltip>
    </motion.div>
  );
}

interface MinimizedPillProps {
  display?: boolean;
  onUpgrade: () => void;
  isLimitReached: boolean;
  limitTriggered: boolean;
  onLimitDismiss: () => void;
  shortcutAccelerator?: string;
}

export function MinimizedPill({
  display = true,
  onUpgrade,
  isLimitReached,
  limitTriggered,
  onLimitDismiss,
  shortcutAccelerator,
}: MinimizedPillProps): React.ReactElement | null {
  const [hovered, setHovered] = useState(false);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isExpanded = hovered || limitTriggered;

  const onMouseEnter = useCallback(() => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    setHovered(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = setTimeout(() => {
      setHovered(false);
      if (limitTriggered) onLimitDismiss();
    }, COLLAPSE_GRACE_MS);
  }, [limitTriggered, onLimitDismiss]);

  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    };
  }, []);

  const shortcutKeys = useMemo(
    () => (shortcutAccelerator ? acceleratorToDisplay(shortcutAccelerator) : []),
    [shortcutAccelerator]
  );

  if (!display) return null;

  const state = computeState({ isExpanded, isLimitReached });

  if (!isExpanded) {
    return <CollapsedPill shortcutKeys={shortcutKeys} onExpand={onMouseEnter} />;
  }

  return (
    <ExpandedPill
      state={state}
      shortcutKeys={shortcutKeys}
      isLimitReached={isLimitReached}
      onUpgrade={onUpgrade}
      onMouseLeave={onMouseLeave}
    />
  );
}
