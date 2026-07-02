import { useEffect, useRef } from "react";
import { driver, type Driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "~/features/home-tour/lib/driver-styles.css";
import { m } from "~/paraglide/messages";
import { getLocale } from "~/paraglide/runtime";
import { useConfig } from "~/hooks/use-config";
import { useAffiliateEnabled } from "~/features/affiliate/hooks/use-affiliate";
import { buildTourSteps } from "~/features/home-tour/lib/tour-steps";

function getProgressTemplate(): string {
  switch (getLocale()) {
    case "pt-BR":
      return "{{current}} de {{total}}";
    default:
      return "{{current}} of {{total}}";
  }
}

const SVG_BASE =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const ARROW_LEFT_SVG = `<svg ${SVG_BASE}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`;
const ARROW_RIGHT_SVG = `<svg ${SVG_BASE}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;

export function useHomeTour() {
  const { config, updateConfig, loaded } = useConfig();
  const { data: affiliateEnabled = false, isLoading: affiliateLoading } = useAffiliateEnabled();
  const seenTourStepsRef = useRef(config.preferences.seenTourSteps);
  seenTourStepsRef.current = config.preferences.seenTourSteps;

  useEffect(() => {
    if (!loaded) return;
    if (affiliateLoading) return;
    if (!config.preferences.onboardingCompleted) return;

    const seen = new Set(seenTourStepsRef.current);
    const allSteps = buildTourSteps({ affiliateEnabled });
    const unseen = allSteps.filter((s) => !seen.has(s.id));
    if (unseen.length === 0) return;

    const shownInThisSession = new Set<string>();

    const driverSteps: DriveStep[] = unseen.map((step) => ({
      element: step.element,
      popover: step.popover,
      onHighlighted: (el, drStep, opts) => {
        shownInThisSession.add(step.id);
        step.onHighlighted?.(el, drStep, opts);
      },
    }));

    const instance: Driver = driver({
      showProgress: true,
      allowClose: true,
      stagePadding: 8,
      stageRadius: 8,
      popoverClass: "shadow-whisper-tour",
      nextBtnText: ARROW_RIGHT_SVG,
      prevBtnText: ARROW_LEFT_SVG,
      doneBtnText: m.tour_finish(),
      progressText: getProgressTemplate(),
      steps: driverSteps,
      onPopoverRender: (popover, { state }) => {
        const isLast =
          typeof state.activeIndex === "number" && state.activeIndex === driverSteps.length - 1;
        popover.nextButton.classList.toggle("tour-btn-text", isLast);
        popover.nextButton.setAttribute("aria-label", isLast ? m.tour_finish() : m.tour_next());
        popover.previousButton.setAttribute("aria-label", m.tour_back());
      },
      onDestroyed: () => {
        if (shownInThisSession.size === 0) return;
        const merged = Array.from(new Set([...seenTourStepsRef.current, ...shownInThisSession]));
        void updateConfig({ preferences: { seenTourSteps: merged } });
      },
    });

    instance.drive();

    return () => {
      instance.destroy();
    };
  }, [
    loaded,
    affiliateLoading,
    affiliateEnabled,
    config.preferences.onboardingCompleted,
    updateConfig,
  ]);
}
