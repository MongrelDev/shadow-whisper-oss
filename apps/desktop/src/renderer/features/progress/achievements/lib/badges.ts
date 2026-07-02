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

export type BadgeTier = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface BadgeMeta {
  Icon: LucideIcon;
  tier: BadgeTier;
  rarity: number;
}

export const BADGE_META: Record<BadgeKey, BadgeMeta> = {
  first_transcription: { Icon: Sparkles, tier: "common", rarity: 100 },
  streak_7: { Icon: Flame, tier: "uncommon", rarity: 34 },
  daily_1k_words: { Icon: Trophy, tier: "rare", rarity: 18 },
  marathon_session: { Icon: Award, tier: "rare", rarity: 10 },
  speed_100wpm: { Icon: Zap, tier: "epic", rarity: 8 },
  app_variety_5: { Icon: Layers, tier: "rare", rarity: 12 },
  bilingual: { Icon: Languages, tier: "uncommon", rarity: 22 },
  streak_30: { Icon: Flame, tier: "rare", rarity: 14 },
  streak_90: { Icon: Flame, tier: "epic", rarity: 5 },
  daily_3k_words: { Icon: Trophy, tier: "epic", rarity: 7 },
  daily_5k_words: { Icon: Trophy, tier: "legendary", rarity: 2 },
  speed_130wpm: { Icon: Zap, tier: "legendary", rarity: 3 },
  skill_explorer: { Icon: Puzzle, tier: "uncommon", rarity: 28 },
  omnichannel: { Icon: MonitorSmartphone, tier: "rare", rarity: 15 },
};

export const TIER_LABELS: Record<BadgeTier, string> = {
  common: "COMUM",
  uncommon: "INCOMUM",
  rare: "RARO",
  epic: "ÉPICO",
  legendary: "LENDÁRIO",
};

export const TIER_COLORS: Record<
  BadgeTier,
  { fg: string; bg: string; border: string; dot: string }
> = {
  common: {
    fg: "text-muted-foreground",
    bg: "bg-muted/60",
    border: "border-border/60",
    dot: "bg-muted-foreground",
  },
  uncommon: {
    fg: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  rare: {
    fg: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
  },
  epic: {
    fg: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    dot: "bg-violet-500",
  },
  legendary: {
    fg: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    dot: "bg-amber-400",
  },
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
