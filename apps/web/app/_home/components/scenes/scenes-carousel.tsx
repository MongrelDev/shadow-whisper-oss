"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

import { SceneAutoTyping } from "./scene-auto-typing";
import { SceneCleanUp } from "./scene-clean-up";
import { SceneDiffView } from "./scene-diff-view";
import { SceneSnippets } from "./scene-snippets";
import { SceneTransformEmail } from "./scene-transform-email";
import { SceneSvgDefs } from "./shared/svg-defs";

type SceneSlideProps = {
  locale: Locale;
  kicker: string;
  title: string;
  description: string;
};

type SceneSlide = {
  key: string;
  fullWidth?: boolean;
  props: SceneSlideProps;
  Component: (props: SceneSlideProps) => React.ReactElement;
};

function buildSlides(locale: Locale): SceneSlide[] {
  return [
    {
      key: "auto-typing",
      Component: SceneAutoTyping,
      props: {
        locale,
        kicker: m.home_feature_1_kicker({}, { locale }),
        title: m.home_feature_1_title({}, { locale }),
        description: m.home_feature_1_description({}, { locale }),
      },
    },
    {
      key: "clean-up",
      Component: SceneCleanUp,
      props: {
        locale,
        kicker: m.home_feature_2_kicker({}, { locale }),
        title: m.home_feature_2_title({}, { locale }),
        description: m.home_feature_2_description({}, { locale }),
      },
    },
    {
      key: "diff-view",
      Component: SceneDiffView,
      props: {
        locale,
        kicker: m.home_feature_3_kicker({}, { locale }),
        title: m.home_feature_3_title({}, { locale }),
        description: m.home_feature_3_description({}, { locale }),
      },
    },
    {
      key: "transform-email",
      Component: SceneTransformEmail,
      props: {
        locale,
        kicker: m.home_feature_4_kicker({}, { locale }),
        title: m.home_feature_4_title({}, { locale }),
        description: m.home_feature_4_description({}, { locale }),
      },
    },
    {
      key: "snippets",
      fullWidth: true,
      Component: SceneSnippets,
      props: {
        locale,
        kicker: m.home_feature_5_kicker({}, { locale }),
        title: m.home_feature_5_title({}, { locale }),
        description: m.home_feature_5_description({}, { locale }),
      },
    },
  ];
}

export function ScenesCarousel({ locale }: { locale: Locale }): React.ReactElement {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const slides = buildSlides(locale);

  const onSelect = useCallback((carousel: CarouselApi) => {
    if (!carousel) return;
    setSelected(carousel.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    api.on("reInit", onSelect);
    api.on("select", onSelect);
    return () => {
      api.off("reInit", onSelect);
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  const snaps = api?.scrollSnapList() ?? [];

  return (
    <div className="mt-12">
      <SceneSvgDefs />
      <Carousel
        setApi={setApi}
        opts={{ align: "start", containScroll: "trimSnaps" }}
        className="w-full"
      >
        <CarouselContent className="-ml-5">
          {slides.map((slide) => (
            <CarouselItem
              key={slide.key}
              className={
                slide.fullWidth ? "basis-[min(1040px,92vw)] pl-5" : "basis-[min(520px,86vw)] pl-5"
              }
            >
              <slide.Component {...slide.props} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex gap-1.5" role="tablist">
          {snaps.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-label={m.home_feature_go_to_slide({ slide: String(i + 1) }, { locale })}
              aria-selected={i === selected}
              onClick={() => api?.scrollTo(i)}
              data-active={i === selected}
              className="group flex h-6 items-center rounded-full transition-colors hover:bg-muted/50"
            >
              <span className="h-1 w-6 rounded-full bg-border transition-colors group-data-[active=true]:bg-primary" />
            </button>
          ))}
        </div>
        <div className="inline-flex gap-2">
          <button
            type="button"
            aria-label={m.home_feature_previous({}, { locale })}
            onClick={() => api?.scrollPrev()}
            className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-background transition-colors hover:border-foreground/20 hover:bg-muted"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={m.home_feature_next({}, { locale })}
            onClick={() => api?.scrollNext()}
            className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-background transition-colors hover:border-foreground/20 hover:bg-muted"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
