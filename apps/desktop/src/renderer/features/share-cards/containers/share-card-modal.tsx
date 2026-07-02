import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Copy, Check, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { m } from "~/paraglide/messages";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useShareCardData } from "../hooks/use-share-card-data";
import { StatusCard } from "../components/status-card";
import { CollectionCard } from "../components/collection-card";
import { RankingCard } from "../components/ranking-card";
import { renderToPng, downloadBlob, copyBlobToClipboard } from "../utils/render-to-png";
import { CARD_WIDTH, CARD_HEIGHT, CARD_THUMB_BG } from "../utils/card-styles";
import { TiltCard } from "../components/tilt-card";
import type { ShareCardData } from "../types";

interface ShareCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ActionState = "idle" | "loading" | "done";

const CARD_DEFS = [
  { id: "status", thumbBg: CARD_THUMB_BG.purple },
  { id: "collection", thumbBg: CARD_THUMB_BG.ink },
  { id: "ranking", thumbBg: CARD_THUMB_BG.gold },
] as const;

type CardId = (typeof CARD_DEFS)[number]["id"];

function cardLabel(id: CardId): string {
  switch (id) {
    case "status":
      return m.share_card_label_status();
    case "collection":
      return m.share_card_label_collection();
    case "ranking":
      return m.share_card_label_ranking();
  }
}

function renderCard(id: CardId, data: ShareCardData) {
  switch (id) {
    case "status":
      return <StatusCard data={data} />;
    case "collection":
      return <CollectionCard userName={data.userName} achievements={data.achievements} />;
    case "ranking":
      return <RankingCard data={data} />;
  }
}

function ActionButton({
  icon: Icon,
  doneIcon: DoneIcon,
  label,
  doneLabel,
  state,
  disabled,
  onClick,
}: {
  icon: typeof Download;
  doneIcon: typeof Check;
  label: string;
  doneLabel: string;
  state: ActionState;
  disabled: boolean;
  onClick: () => void;
}) {
  const shownLabel = state === "done" ? doneLabel : label;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={state === "loading"}
      className="flex min-h-9 items-center justify-center gap-2 rounded-md border border-border
        bg-background px-4 text-sm font-medium text-muted-foreground transition-colors
        hover:bg-muted hover:text-foreground active:bg-muted disabled:pointer-events-none
        disabled:opacity-50"
    >
      {state === "loading" && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {state === "done" && <DoneIcon className="size-4 text-primary" aria-hidden />}
      {state === "idle" && <Icon className="size-4" aria-hidden />}
      {shownLabel}
    </button>
  );
}

function usePreviewScale(containerRef: RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(0.7);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const available = entry.contentRect.width - 80;
      setScale(Math.min(0.7, available / CARD_WIDTH));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  return scale;
}

function CarouselPreview({
  cardRef,
  containerRef,
  data,
  isLoading,
  error,
  retry,
  activeIdx,
  scale,
  onPrev,
  onNext,
  onKeyDown,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  data: ShareCardData | undefined;
  isLoading: boolean;
  error: unknown;
  retry: () => void;
  activeIdx: number;
  scale: number;
  onPrev: () => void;
  onNext: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  return (
    <div
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={m.share_card_carousel_label()}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="relative flex min-h-56 items-center justify-center overflow-hidden bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
      style={{ maxHeight: 440 }}
    >
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          {m.share_card_preparing()}
        </div>
      )}

      {Boolean(error) && !isLoading && (
        <div className="flex max-w-xs flex-col items-center justify-center gap-4 py-14 text-center">
          <p className="text-sm text-muted-foreground">{m.share_card_prepare_error()}</p>
          <button
            type="button"
            onClick={retry}
            className="min-h-9 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground
              transition-colors hover:bg-primary/90 active:bg-primary/85"
          >
            {m.share_card_retry()}
          </button>
        </div>
      )}

      {data && (
        <>
          <button
            type="button"
            onClick={onPrev}
            aria-label={m.share_card_prev()}
            className="absolute left-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center
              rounded-full border border-border bg-background text-muted-foreground shadow-sm
              transition-colors hover:bg-muted hover:text-foreground
              before:absolute before:inset-[-6px] before:content-['']"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>

          <div ref={cardRef} className="py-4">
            <TiltCard borderRadius={16 * scale}>
              <div
                aria-live="polite"
                style={{
                  width: CARD_WIDTH * scale,
                  height: CARD_HEIGHT * scale,
                  position: "relative",
                }}
              >
                <div
                  data-share-card
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    width: CARD_WIDTH,
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                >
                  {renderCard((CARD_DEFS[activeIdx] ?? CARD_DEFS[0]).id, data)}
                </div>
              </div>
            </TiltCard>
          </div>

          <button
            type="button"
            onClick={onNext}
            aria-label={m.share_card_next()}
            className="absolute right-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center
              rounded-full border border-border bg-background text-muted-foreground shadow-sm
              transition-colors hover:bg-muted hover:text-foreground
              before:absolute before:inset-[-6px] before:content-['']"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </>
      )}
    </div>
  );
}

function Thumbnails({
  activeIdx,
  onSelect,
}: {
  activeIdx: number;
  onSelect: (idx: number) => void;
}) {
  return (
    <div
      role="group"
      aria-label={m.share_card_select_group()}
      className="flex justify-center gap-2 px-4 py-3"
    >
      {CARD_DEFS.map((card, i) => (
        <button
          key={card.id}
          type="button"
          aria-pressed={i === activeIdx}
          aria-label={cardLabel(card.id)}
          onClick={() => onSelect(i)}
          className={cn(
            "flex items-center justify-center rounded-lg border p-0 transition-all",
            i === activeIdx
              ? "border-primary/60 ring-1 ring-primary/30"
              : "border-border/60 hover:border-border"
          )}
        >
          <div
            className="flex items-center justify-center rounded-md text-center font-mono text-[9px] uppercase tracking-widest text-white/85"
            style={{
              width: 80,
              height: 53,
              background: card.thumbBg,
              padding: 6,
            }}
          >
            {cardLabel(card.id)}
          </div>
        </button>
      ))}
    </div>
  );
}

export function ShareCardModal({ open, onOpenChange }: ShareCardModalProps) {
  if (!open) return null;
  return <OpenShareCardModal open={open} onOpenChange={onOpenChange} />;
}

function OpenShareCardModal({ open, onOpenChange }: ShareCardModalProps) {
  const { data, isLoading, error, retry } = useShareCardData();
  const [activeIdx, setActiveIdx] = useState(0);
  const [downloadState, setDownloadState] = useState<ActionState>("idle");
  const [copyState, setCopyState] = useState<ActionState>("idle");
  const [status, setStatus] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const card = CARD_DEFS[activeIdx] ?? CARD_DEFS[0];
  const scale = usePreviewScale(containerRef);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const showSuccess = useCallback((reset: () => void) => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      reset();
      setStatus(null);
    }, 2400);
  }, []);

  const resetFeedback = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setStatus(null);
  }, []);

  const getCardElement = useCallback((): HTMLElement | null => {
    return cardRef.current?.querySelector("[data-share-card]") ?? null;
  }, []);

  const handleDownload = useCallback(async () => {
    const el = getCardElement();
    if (!el) return;
    resetFeedback();
    setDownloadState("loading");
    try {
      const blob = await renderToPng(el, CARD_WIDTH);
      downloadBlob(blob, `shadowwhisper-${card.id}.png`);
      setDownloadState("done");
      showSuccess(() => setDownloadState("idle"));
    } catch {
      setDownloadState("idle");
      setStatus(m.share_card_download_error());
    }
  }, [getCardElement, card.id, resetFeedback, showSuccess]);

  const handleCopy = useCallback(async () => {
    const el = getCardElement();
    if (!el) return;
    resetFeedback();
    setCopyState("loading");
    try {
      const blob = await renderToPng(el, CARD_WIDTH);
      await copyBlobToClipboard(blob);
      setCopyState("done");
      showSuccess(() => setCopyState("idle"));
    } catch {
      setCopyState("idle");
      setStatus(m.share_card_copy_error());
    }
  }, [getCardElement, resetFeedback, showSuccess]);

  const prev = useCallback(() => {
    setActiveIdx((i) => (i - 1 + CARD_DEFS.length) % CARD_DEFS.length);
  }, []);

  const next = useCallback(() => {
    setActiveIdx((i) => (i + 1) % CARD_DEFS.length);
  }, []);

  const handleCarouselKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    },
    [prev, next]
  );

  const busy = downloadState === "loading" || copyState === "loading";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100%_-_1rem)] max-w-[520px] gap-0 overflow-hidden p-0"
        hideClose
      >
        <DialogDescription className="sr-only">
          {m.share_card_dialog_description()}
        </DialogDescription>

        <div className="px-4 pt-4 pb-3 min-[460px]:px-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-base font-semibold">{m.share_card_title()}</DialogTitle>
              <p className="mt-0.5 font-mono text-[10px] tracking-wider text-muted-foreground">
                {m.share_card_counter({
                  current: activeIdx + 1,
                  total: CARD_DEFS.length,
                  label: cardLabel(card.id),
                })}
              </p>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground
                  transition-colors hover:bg-muted hover:text-foreground active:bg-muted"
              >
                <X className="size-4" aria-hidden />
                <span className="sr-only">{m.share_card_close()}</span>
              </button>
            </DialogClose>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <ActionButton
              icon={Copy}
              doneIcon={Check}
              label={m.share_card_copy()}
              doneLabel={m.share_card_copied()}
              state={copyState}
              disabled={!data || busy}
              onClick={handleCopy}
            />
            <ActionButton
              icon={Download}
              doneIcon={Check}
              label={m.share_card_download()}
              doneLabel={m.share_card_downloaded()}
              state={downloadState}
              disabled={!data || busy}
              onClick={handleDownload}
            />
          </div>

          {status && (
            <p className="mt-2 text-center text-sm text-muted-foreground" aria-live="polite">
              {status}
            </p>
          )}
        </div>

        <div className="border-t border-border" />

        <CarouselPreview
          cardRef={cardRef}
          containerRef={containerRef}
          data={data}
          isLoading={isLoading}
          error={error}
          retry={retry}
          activeIdx={activeIdx}
          scale={scale}
          onPrev={prev}
          onNext={next}
          onKeyDown={handleCarouselKeyDown}
        />

        <div className="border-t border-border" />

        <Thumbnails activeIdx={activeIdx} onSelect={setActiveIdx} />
      </DialogContent>
    </Dialog>
  );
}
