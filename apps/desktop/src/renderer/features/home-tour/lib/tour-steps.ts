import { m } from "~/paraglide/messages";
import type { TourStep } from "./tour-types";

export interface BuildTourStepsOptions {
  affiliateEnabled: boolean;
}

export function buildTourSteps(options: BuildTourStepsOptions): TourStep[] {
  const steps: TourStep[] = [
    {
      id: "home.status",
      element: '[data-tour="home-status"]',
      popover: {
        title: m.tour_step_home_status_title(),
        description: m.tour_step_home_status_body(),
        side: "bottom",
        align: "start",
      },
    },
    {
      id: "home.history",
      element: '[data-tour="home-history"]',
      popover: {
        title: m.tour_step_home_history_title(),
        description: m.tour_step_home_history_body(),
        side: "top",
        align: "center",
      },
    },
    {
      id: "nav.dictionary",
      element: '[data-tour="nav-dictionary"]',
      popover: {
        title: m.tour_step_nav_dictionary_title(),
        description: m.tour_step_nav_dictionary_body(),
        side: "right",
        align: "center",
      },
    },
    {
      id: "nav.settings",
      element: '[data-tour="nav-settings"]',
      popover: {
        title: m.tour_step_nav_settings_title(),
        description: m.tour_step_nav_settings_body(),
        side: "right",
        align: "center",
      },
    },
    {
      id: "nav.skills",
      element: '[data-tour="nav-skills"]',
      popover: {
        title: m.tour_step_nav_skills_title(),
        description: m.tour_step_nav_skills_body(),
        side: "right",
        align: "center",
      },
    },
  ];

  if (options.affiliateEnabled) {
    steps.splice(3, 0, {
      id: "nav.affiliate",
      element: '[data-tour="nav-affiliate"]',
      popover: {
        title: m.tour_step_nav_affiliate_title(),
        description: m.tour_step_nav_affiliate_body(),
        side: "right",
        align: "center",
      },
    });
  }

  return steps;
}
