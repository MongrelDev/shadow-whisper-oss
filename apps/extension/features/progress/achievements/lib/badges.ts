import {
  Flame,
  Trophy,
  Zap,
  Layers,
  Languages,
  Sparkles,
  Award,
  Puzzle,
  MonitorSmartphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { m } from "~/paraglide/messages";

export const BADGE_ORDER = [
  "first_transcription",
  "streak_7",
  "daily_1k_words",
  "marathon_session",
  "speed_100wpm",
  "app_variety_5",
  "bilingual",
  "streak_30",
  "streak_90",
  "daily_3k_words",
  "daily_5k_words",
  "speed_130wpm",
  "skill_explorer",
  "omnichannel",
] as const;

export type BadgeKey = (typeof BADGE_ORDER)[number];

export const BADGE_META: Record<BadgeKey, { Icon: LucideIcon; color: string }> = {
  first_transcription: { Icon: Sparkles, color: "text-amber-400" },
  streak_7: { Icon: Flame, color: "text-orange-500" },
  daily_1k_words: { Icon: Trophy, color: "text-yellow-400" },
  marathon_session: { Icon: Award, color: "text-violet-400" },
  speed_100wpm: { Icon: Zap, color: "text-cyan-400" },
  app_variety_5: { Icon: Layers, color: "text-emerald-400" },
  bilingual: { Icon: Languages, color: "text-pink-400" },
  streak_30: { Icon: Flame, color: "text-orange-600" },
  streak_90: { Icon: Flame, color: "text-red-500" },
  daily_3k_words: { Icon: Trophy, color: "text-yellow-500" },
  daily_5k_words: { Icon: Trophy, color: "text-amber-500" },
  speed_130wpm: { Icon: Zap, color: "text-sky-400" },
  skill_explorer: { Icon: Puzzle, color: "text-indigo-400" },
  omnichannel: { Icon: MonitorSmartphone, color: "text-teal-400" },
};

export const BADGE_CATEGORIES = {
  habit: [
    "first_transcription",
    "streak_7",
    "streak_30",
    "streak_90",
    "daily_1k_words",
    "daily_3k_words",
    "daily_5k_words",
  ],
  progress: ["marathon_session", "speed_100wpm", "speed_130wpm"],
  discovery: ["app_variety_5", "bilingual", "skill_explorer", "omnichannel"],
} as const satisfies Record<string, readonly BadgeKey[]>;

const messages = m as unknown as Record<string, () => string>;

export function getBadgeTitle(key: BadgeKey): string {
  const titleFn = messages[`badge_${key}_title`];
  return titleFn ? titleFn() : key;
}

export function getBadgeDesc(key: BadgeKey): string {
  const descFn = messages[`badge_${key}_desc`];
  return descFn ? descFn() : "";
}
