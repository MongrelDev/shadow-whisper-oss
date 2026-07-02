import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, ThumbsUp, ThumbsDown, Copy, X } from "lucide-react";
import { m } from "~/paraglide/messages";
import { cn } from "@/lib/utils";
import type { DiffPart } from "../lib/diff-helpers";
import { computeWordDiffRatio, countWords } from "../lib/diff-helpers";
import { getLocale } from "~/paraglide/runtime";
import { usePillStore } from "../stores/pill-store";

const THANKS_AUTO_CLOSE_MS = 2000;

function DiffWord({ part }: { part: DiffPart }): React.ReactElement {
  if (part.type === "removed") {
    return (
      <span className="text-muted-foreground/60 line-through decoration-destructive/55 decoration-[1.5px]">
        {part.text}
      </span>
    );
  }
  if (part.type === "added") {
    return (
      <span className="rounded bg-(--diff-ins-bg) px-1 py-px text-diff-ins-fg shadow-[inset_0_0_0_1px_var(--diff-ins-ring)]">
        {part.text}
      </span>
    );
  }
  return <span>{part.text}</span>;
}

function DiffContent({ parts }: { parts: DiffPart[] }): React.ReactElement {
  return (
    <div className="overflow-y-auto" style={{ maxHeight: "5lh" }}>
      <p className="m-0 inline text-[13.5px] leading-[1.6] tracking-[-0.005em] text-foreground">
        {parts.map((part, i) => (
          <span key={i}>
            <DiffWord part={part} />
            {i < parts.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
    </div>
  );
}

function PanelButton({
  onClick,
  variant = "default",
  children,
}: {
  onClick: () => void;
  variant?: "default" | "primary";
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      className={cn(
        "relative inline-flex items-center gap-[5px] rounded-[7px] border px-[9px] py-1 text-[11px] tracking-[-0.005em] transition-colors before:absolute before:-inset-1 before:content-[''] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60",
        variant === "primary"
          ? "border-primary/45 bg-primary/24 text-diff-ins-fg hover:bg-primary/32"
          : "border-border bg-transparent text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
      )}
    >
      {children}
    </motion.button>
  );
}

interface DiffPanelInnerProps {
  rawText: string;
  formattedText: string;
  parts: DiffPart[];
  onClose: () => void;
}

function DiffPanelInner({
  rawText,
  formattedText,
  parts,
  onClose,
}: DiffPanelInnerProps): React.ReactElement {
  const [thanks, setThanks] = useState(false);
  const thanksTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (thanksTimerRef.current) clearTimeout(thanksTimerRef.current);
    };
  }, []);

  const sendFeedback = useCallback(
    (rating: "like" | "dislike") => {
      window.api.feedback.sendCleanupFeedback({
        rating,
        rawText,
        formattedText,
        language: getLocale(),
        wordCount: countWords(formattedText),
        diffRatio: computeWordDiffRatio(rawText, formattedText),
        transcriptionCreatedAt: new Date().toISOString(),
        bundleId: null,
        host: null,
        appCategory: null,
        installedSkillCount: null,
      });
    },
    [rawText, formattedText]
  );

  const handleFeedback = useCallback(
    (rating: "like" | "dislike") => {
      sendFeedback(rating);
      setThanks(true);
      thanksTimerRef.current = setTimeout(onClose, THANKS_AUTO_CLOSE_MS);
    },
    [onClose, sendFeedback]
  );

  const handleCopyOriginal = useCallback(() => {
    window.api.clipboard.write(rawText);
  }, [rawText]);

  const handleCopyCleaned = useCallback(() => {
    window.api.clipboard.write(formattedText);
  }, [formattedText]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[560px] overflow-hidden rounded-[14px] border border-border/60 bg-gradient-to-b from-(--diff-surface-from) to-(--diff-surface-to) shadow-[var(--diff-shadow)]"
      role="region"
      aria-label={m.diff_panel_title()}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-2.5 py-2 pl-3">
        <span className="inline-flex size-3.5 items-center justify-center rounded-[5px] border border-primary/32 bg-primary/18 text-primary/80">
          <Sparkles className="size-2" aria-hidden />
        </span>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">
          {m.diff_panel_title()}
        </span>
        <motion.button
          type="button"
          onClick={onClose}
          whileTap={{ scale: 0.9 }}
          className="relative ml-auto flex size-[22px] items-center justify-center rounded-md text-muted-foreground transition-colors before:absolute before:-inset-2 before:content-[''] hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60"
          aria-label={m.diff_panel_close()}
        >
          <X className="size-[11px]" strokeWidth={2.4} />
        </motion.button>
      </div>

      {/* Diff body */}
      <div className="px-3.5 pb-3.5 pt-0.5">
        <DiffContent parts={parts} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2.5 border-t border-border/30 px-2 py-2 pl-3">
        <FooterStatus thanks={thanks} onFeedback={handleFeedback} />
        <div className="ml-auto flex items-center gap-1.5">
          <PanelButton onClick={handleCopyOriginal}>
            <Copy className="size-[9px]" aria-hidden />
            <span>{m.diff_panel_copy_original()}</span>
          </PanelButton>
          <PanelButton variant="primary" onClick={handleCopyCleaned}>
            <Copy className="size-[9px]" aria-hidden />
            <span>{m.diff_panel_copy_cleaned()}</span>
          </PanelButton>
        </div>
      </div>
    </motion.div>
  );
}

function FooterStatus({
  thanks,
  onFeedback,
}: {
  thanks: boolean;
  onFeedback: (rating: "like" | "dislike") => void;
}): React.ReactElement {
  if (thanks) {
    return (
      <span className="flex-1 font-mono text-[10px] tracking-[0.04em] text-muted-foreground/60">
        {m.diff_panel_thanks()}
      </span>
    );
  }
  return (
    <>
      <span className="font-mono text-[10px] tracking-[0.04em] text-muted-foreground/60">
        {m.diff_panel_pasted()}
      </span>
      <div className="flex items-center gap-1.5">
        <PanelButton onClick={() => onFeedback("like")}>
          <ThumbsUp className="size-[9px]" aria-hidden />
        </PanelButton>
        <PanelButton onClick={() => onFeedback("dislike")}>
          <ThumbsDown className="size-[9px]" aria-hidden />
        </PanelButton>
      </div>
    </>
  );
}

export function DiffPanel(): React.ReactElement | null {
  const { diffPanelOpen, diffPanelData, closeDiffPanel } = usePillStore();

  if (!diffPanelOpen || diffPanelData === null) return null;

  return (
    <DiffPanelInner
      rawText={diffPanelData.rawText}
      formattedText={diffPanelData.formattedText}
      parts={diffPanelData.diffParts}
      onClose={closeDiffPanel}
    />
  );
}
