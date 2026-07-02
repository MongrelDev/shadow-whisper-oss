import type { DriveStep } from "driver.js";

export type TourStep = DriveStep & {
  /**
   * Stable persistence ID. Dot-namespaced (e.g. "home.status", "nav.transforms").
   * Bump with `.v2` suffix only for material UX changes — renaming forces re-show for every existing user.
   */
  id: string;
};
