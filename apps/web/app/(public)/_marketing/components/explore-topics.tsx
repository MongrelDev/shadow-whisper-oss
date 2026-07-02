import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Locale } from "~/paraglide/runtime";

import { cn } from "@/lib/utils";

import { type MarketingTopic, topicHref } from "../lib/routes";

type UseCaseTile = {
  topic: MarketingTopic;
  tag: string;
  title: string;
  blurb: string;
};

type RoadmapItem = {
  topic: MarketingTopic;
  name: string;
  blurb: string;
  cta: string;
};

type Header = {
  eyebrow: string;
  title: string;
  lede: string;
};

type ExploreCopy = {
  home: Header;
  article: Header;
  tiles: readonly UseCaseTile[];
  roadmapEyebrow: string;
  roadmapTitle: string;
  roadmapItems: readonly RoadmapItem[];
  soonLabel: string;
};

const COPY: Record<Locale, ExploreCopy> = {
  en: {
    home: {
      eyebrow: "Use cases",
      title: "How people use Shadow Whisper",
      lede: "Real workflows, one shortcut away. Pick the one that sounds like your day.",
    },
    article: {
      eyebrow: "Keep exploring",
      title: "More ways to use Shadow Whisper",
      lede: "Other workflows, one shortcut away. Pick another that sounds like your day.",
    },
    tiles: [
      {
        topic: "whatsapp",
        tag: "WhatsApp",
        title: "Message clients on WhatsApp",
        blurb: "Turn rambling voice notes into clean, sales-ready text.",
      },
      {
        topic: "email",
        tag: "Email",
        title: "Draft email by voice",
        blurb: "Speak one line, get a structured, professional message.",
      },
      {
        topic: "mac",
        tag: "Mac",
        title: "Dictate in any Mac app",
        blurb: "One shortcut drops clean text wherever the cursor sits.",
      },
      {
        topic: "slackBilingual",
        tag: "Bilingual",
        title: "Speak Portuguese, write English",
        blurb: "Dictate in one language, the text lands in another.",
      },
      {
        topic: "wispr",
        tag: "Compare",
        title: "Coming from Wispr Flow",
        blurb: "Same flow, sharper cleanup, a price that makes sense.",
      },
      {
        topic: "cloudVsLocal",
        tag: "Compare",
        title: "Cloud vs. local dictation",
        blurb: "Why cloud transcription wins on accuracy and languages.",
      },
    ],
    roadmapEyebrow: "On the roadmap",
    roadmapTitle: "Designed and on the way",
    roadmapItems: [
      {
        topic: "echo",
        name: "Echo",
        blurb:
          "The answer to a question you ask mid-dictation, surfaced on the context pill without opening a browser.",
        cta: "See Echo",
      },
      {
        topic: "scratchpad",
        name: "Scratch Pad",
        blurb:
          "Linked Markdown notes the AI reads as your memory, so it writes with your prices, deadlines and decisions.",
        cta: "See the Scratch Pad",
      },
    ],
    soonLabel: "on the roadmap",
  },
  "pt-BR": {
    home: {
      eyebrow: "Casos de uso",
      title: "Como as pessoas usam o Shadow Whisper",
      lede: "Fluxos reais, a um atalho de distância. Escolha o que parece o seu dia.",
    },
    article: {
      eyebrow: "Continue explorando",
      title: "Mais formas de usar o Shadow Whisper",
      lede: "Outros fluxos, a um atalho de distância. Escolha outro que parece o seu dia.",
    },
    tiles: [
      {
        topic: "whatsapp",
        tag: "WhatsApp",
        title: "Falar com cliente no WhatsApp",
        blurb: "Vira o áudio enrolado em texto limpo, pronto pra vender.",
      },
      {
        topic: "email",
        tag: "E-mail",
        title: "Escrever e-mail falando",
        blurb: "Fale uma linha e receba uma mensagem estruturada e profissional.",
      },
      {
        topic: "mac",
        tag: "Mac",
        title: "Ditar em qualquer app no Mac",
        blurb: "Um atalho solta texto limpo onde o cursor estiver.",
      },
      {
        topic: "slackBilingual",
        tag: "Bilíngue",
        title: "Falar português, escrever inglês",
        blurb: "Dite em PT e o texto sai em inglês, pronto pro time.",
      },
      {
        topic: "wispr",
        tag: "Comparar",
        title: "Vindo do Wispr Flow",
        blurb: "Mesma fluidez, limpeza melhor, um preço que faz sentido.",
      },
      {
        topic: "cloudVsLocal",
        tag: "Comparar",
        title: "Nuvem vs. local",
        blurb: "Por que transcrever na nuvem ganha em precisão e idiomas.",
      },
    ],
    roadmapEyebrow: "No roadmap",
    roadmapTitle: "Em desenho, a caminho",
    roadmapItems: [
      {
        topic: "echo",
        name: "Echo",
        blurb:
          "A resposta da dúvida que você fala no meio do ditado, na pílula de contexto, sem abrir o navegador.",
        cta: "Ver o Echo",
      },
      {
        topic: "scratchpad",
        name: "Scratch Pad",
        blurb:
          "Notas em Markdown ligadas que a IA lê como sua memória, pra escrever com seus preços, prazos e decisões.",
        cta: "Ver o Scratch Pad",
      },
    ],
    soonLabel: "em breve",
  },
};

export function ExploreTopics({
  locale,
  excludeTopic,
  id,
  variant = "home",
  bordered = true,
  paddingClassName = "py-20 lg:py-24",
}: {
  locale: Locale;
  excludeTopic?: MarketingTopic;
  id?: string;
  variant?: "home" | "article";
  bordered?: boolean;
  paddingClassName?: string;
}): React.ReactElement {
  const copy = COPY[locale];
  const header = copy[variant];

  return (
    <section id={id} className={bordered ? "border-b border-border/60" : undefined}>
      <div className={cn("mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-12", paddingClassName)}>
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            {header.eyebrow}
          </p>
          <h2 className="mt-4 text-[clamp(1.75rem,3.6vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-balance">
            {header.title}
          </h2>
          <p className="mt-4 text-base leading-[1.7] text-muted-foreground">{header.lede}</p>
        </div>

        <TileGrid copy={copy} locale={locale} excludeTopic={excludeTopic} />

        <RoadmapBlock copy={copy} locale={locale} excludeTopic={excludeTopic} />
      </div>
    </section>
  );
}

function TileGrid({
  copy,
  locale,
  excludeTopic,
}: {
  copy: ExploreCopy;
  locale: Locale;
  excludeTopic?: MarketingTopic;
}): React.ReactElement {
  const visible = copy.tiles.flatMap((tile) => {
    if (tile.topic === excludeTopic) return [];
    const href = topicHref(locale, tile.topic);
    return href ? [{ tile, href }] : [];
  });
  const fillers = (6 - (visible.length % 6)) % 6;

  return (
    <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-border">
      <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(({ tile, href }) => (
          <TileLink key={tile.topic} href={href} tile={tile} />
        ))}
        {Array.from({ length: fillers }, (_, i) => (
          <div key={`filler-${i}`} aria-hidden className="bg-background" />
        ))}
      </div>
    </div>
  );
}

function TileLink({ href, tile }: { href: string; tile: UseCaseTile }): React.ReactElement {
  return (
    <Link
      href={href}
      className="group flex min-h-40 flex-col bg-background p-6 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {tile.tag}
      </span>
      <h3 className="mt-3 text-lg font-semibold leading-snug tracking-[-0.015em] text-balance">
        {tile.title}
      </h3>
      <p className="mt-2 text-pretty text-sm leading-[1.6] text-muted-foreground">{tile.blurb}</p>
      <ArrowUpRight
        aria-hidden
        className="mt-auto size-4 text-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
      />
    </Link>
  );
}

function RoadmapBlock({
  copy,
  locale,
  excludeTopic,
}: {
  copy: ExploreCopy;
  locale: Locale;
  excludeTopic?: MarketingTopic;
}): React.ReactElement | null {
  const items = copy.roadmapItems.flatMap((item) => {
    if (item.topic === excludeTopic) return [];
    const href = topicHref(locale, item.topic);
    return href ? [{ item, href }] : [];
  });
  if (items.length === 0) return null;

  return (
    <div className="mt-20">
      <div className="flex items-baseline gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
          {copy.roadmapEyebrow}
        </p>
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>
      <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em]">{copy.roadmapTitle}</h3>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border">
        {items.map(({ item, href }) => (
          <RoadmapRow key={item.topic} href={href} item={item} soonLabel={copy.soonLabel} />
        ))}
      </div>
    </div>
  );
}

function RoadmapRow({
  href,
  item,
  soonLabel,
}: {
  href: string;
  item: RoadmapItem;
  soonLabel: string;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-5 border-b border-border p-7 transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-8 sm:p-9"
    >
      <h4 className="w-44 shrink-0 text-2xl font-semibold tracking-[-0.02em]">{item.name}</h4>
      <p className="flex-1 text-pretty text-[15px] leading-[1.6] text-muted-foreground">
        {item.blurb}
      </p>
      <span
        aria-hidden
        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground/70 transition-colors group-hover:text-foreground"
      >
        {item.cta}
        <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
      <span className="sr-only">{`${item.cta} (${soonLabel})`}</span>
    </Link>
  );
}
