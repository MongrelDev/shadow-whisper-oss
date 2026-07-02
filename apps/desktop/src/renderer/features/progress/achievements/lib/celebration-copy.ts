import type { AchievementKey } from "@whisper/api";
import { m } from "~/paraglide/messages";

const messages = m as unknown as Record<string, (params?: Record<string, unknown>) => string>;

export function getCelebrationTitle(key: AchievementKey): string {
  const fn = messages[`badge_celebration_${key}_title`];
  return fn ? fn() : key;
}

export function getCelebrationSubtitle(key: AchievementKey): string {
  const fn = messages[`badge_celebration_${key}_subtitle`];
  return fn ? fn() : "";
}
