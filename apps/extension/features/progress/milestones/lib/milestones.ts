import { BookOpen, Library, Mountain, Award, Crown, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { m } from "~/paraglide/messages";
import { MILESTONE_KEYS } from "@whisper/api";
import type { MilestoneKey } from "@whisper/api";

export type { MilestoneKey };

export const MILESTONE_ORDER = MILESTONE_KEYS;

export const MILESTONE_META: Record<
  MilestoneKey,
  { Icon: LucideIcon; color: string; threshold: number }
> = {
  milestone_10k: {
    Icon: BookOpen,
    color: "text-sky-400",
    threshold: 10_000,
  },
  milestone_25k: {
    Icon: Library,
    color: "text-teal-400",
    threshold: 25_000,
  },
  milestone_50k: {
    Icon: Mountain,
    color: "text-emerald-400",
    threshold: 50_000,
  },
  milestone_100k: {
    Icon: Award,
    color: "text-violet-400",
    threshold: 100_000,
  },
  milestone_250k: {
    Icon: Crown,
    color: "text-amber-400",
    threshold: 250_000,
  },
  milestone_500k: {
    Icon: Trophy,
    color: "text-yellow-400",
    threshold: 500_000,
  },
};

const messages = m as unknown as Record<string, () => string>;

export function getMilestoneTitle(key: MilestoneKey): string {
  const fn = messages[`${key}_title`];
  return fn ? fn() : key;
}

export function getMilestoneDesc(key: MilestoneKey): string {
  const fn = messages[`${key}_desc`];
  return fn ? fn() : "";
}
