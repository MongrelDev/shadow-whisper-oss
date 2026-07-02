import type { ErrorCode } from "./errors";

export type ApiResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ErrorCode };

export interface MutationSuccessResponse {
  success: true;
}

export interface HealthResponse {
  status: string;
  timestamp: number;
}

export interface DictionaryWord {
  id: number;
  word: string;
  createdAt: number;
}

export interface Snippet {
  id: number;
  triggerPhrase: string;
  expandedText: string;
  createdAt: number;
}

export interface Dictionary {
  words: DictionaryWord[];
  snippets: Snippet[];
}

export type Plan = "free" | "pro" | "byok";
export type BillingCurrency = "BRL" | "USD";
export type PlanAvailability = "active" | "coming_soon";
export type PlanFeatureKey =
  | "weekly_words_2000"
  | "global_shortcut"
  | "ai_cleanup"
  | "history_7_days"
  | "unlimited_dictation"
  | "full_ai_rewrite"
  | "personal_dictionary"
  | "cloud_history"
  | "bring_your_own_key"
  | "multi_provider_support"
  | "unlimited_words"
  | "ai_cost_on_your_account";

export type DisplayStatus = "free" | "active" | "canceling" | "canceled";

export interface PlanPrice {
  amountInCents: number;
  currency: BillingCurrency;
}

export interface SubscriptionStatus {
  plan: Plan;
  status: string;
  displayStatus: DisplayStatus;
  trialEnd: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: number | null;
  usage: {
    spokenWords: number;
    transformedWords: number;
    totalWords: number;
    limit: number;
  };
}

export interface PlanInfo {
  name: Plan;
  availability: PlanAvailability;
  monthly: PlanPrice;
  annual: PlanPrice;
  featureKeys: PlanFeatureKey[];
  recommended?: boolean;
  annualSavingsInMonths?: number;
  trialDays?: number;
  wordLimit?: number;
}

export interface CheckoutTokenResponse {
  token: string;
}

export interface GuestBootResponse {
  agentId: string;
}

export interface GuestWarmupResponse {
  sessionId: string;
}

export interface GuestTranscribeResponse {
  rawText: string;
  cleanText: string;
  durationMs: number;
  wordCount: number;
}

export interface GuestSkillResponse {
  cleanText: string;
  wordCount: number;
}

export interface GuestSkillsResponse {
  transformers: Array<{ id: string; label: string; description: string }>;
}

export interface CheckoutVerificationResponse {
  active: boolean;
  plan: Plan;
  status: string;
  trialEnd: number | null;
}

export interface WhisperWarmupResponse {
  sessionId: string;
  wsUrl: string;
}

export interface SessionWarmupResponse {
  sessionId: string;
}

export interface AffiliateProfileResponse {
  code: string;
  isActive: boolean;
  createdAt: string;
  eligibility: {
    canParticipate: boolean;
    reason: "missing_stripe_customer" | "missing_active_subscription" | null;
  };
}

export type ReferralStatus = "pending" | "qualified" | "rewarded" | "rejected";

export interface AffiliateReferralItem {
  referredEmail: string;
  referredName: string;
  status: ReferralStatus;
  createdAt: string;
  qualifiedAt: string | null;
  rewardedAt: string | null;
  rewardGranted: boolean;
}

export interface AffiliateDashboard {
  profile: {
    code: string;
    isActive: boolean;
    createdAt: string;
    eligibility: {
      canParticipate: boolean;
      reason: "missing_stripe_customer" | "missing_active_subscription" | null;
    };
  };
  stats: {
    totalReferrals: number;
    grantedRewardDays: number;
  };
  referrals: AffiliateReferralItem[];
}

export interface AffiliateSignupResponse {
  success: true;
  trialDays: number;
}

export interface EmailStatusResponse {
  verified: boolean;
}

export interface GoogleTokenResponse {
  idToken: string;
  accessToken: string;
}

export type SkillSource = "official" | "custom";

export interface Skill {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  triggers: string[];
  markdown: string | null;
  source: SkillSource;
  isInstalled: boolean;
  createdAt: number | null;
  updatedAt: number | null;
}

export interface SkillListResponse {
  skills: Skill[];
}

export interface SkillInstallationResponse {
  installed: boolean;
}

export interface ExecuteSkillSyncResponse {
  executionId: string;
  cleanText: string;
  wordCount: number;
}

export interface BuildSkillResponse {
  displayName: string;
  description: string;
  slug: string;
  triggers: string[];
  markdown: string;
}

export interface CreateSkillResponse {
  skill: Skill & { markdown: string };
}

export interface UpdateSkillResponse {
  skill: Skill & { markdown: string };
}

export interface DeleteSkillResponse {
  deleted: true;
}

export interface IngestTeachResponse {
  feedbackId: string;
  instanceId: string | null;
}

export interface PendingSuggestionResponse {
  id: string;
  feedbackId: string;
  original: string;
  replacement: string;
  context: string;
  selectedText: string;
  source: string;
  status: string;
  createdAt: number;
}

export interface PendingSuggestionsListResponse {
  suggestions: PendingSuggestionResponse[];
}

export interface DailyBreakdownItem {
  localDate: string;
  platform: string;
  os: string;
  hostName: string;
  category: string;
  wordCount: number;
  durationMs: number;
  entryCount: number;
}

export interface DailyBreakdownResponse {
  from: string;
  to: string;
  items: ReadonlyArray<DailyBreakdownItem>;
  achievementDates: ReadonlyArray<string>;
}

export interface AchievementProgress {
  current: number;
  target: number;
  label: string;
}

export interface AchievementItem {
  key: string;
  earnedAt: number | null;
  contextJson: string | null;
  progress?: AchievementProgress;
}

export interface AchievementsResponse {
  items: ReadonlyArray<AchievementItem>;
}

export interface MilestoneItem {
  key: string;
  earnedAt: number | null;
  contextJson: string | null;
}

export interface UserStatsResponse {
  currentStreak: number;
  weeklyAvgWpm: number;
  totalWords: number;
  isFirstWeek: boolean;
  hasAnyEntries: boolean;
  achievements: ReadonlyArray<AchievementItem>;
  milestones: ReadonlyArray<MilestoneItem>;
}

export interface ShareCardStatsResponse {
  totalWords: number;
  totalDuration: number;
  totalTranscriptions: number;
  weeklyAvgWpm: number;
  currentStreak: number;
  maxStreak: number;
  memberSince: number | null;
  personalBestWpm: number;
  distinctSkillsAllTime: number;
  distinctLanguagesAllTime: number;
  achievements: ReadonlyArray<AchievementItem>;
  milestones: ReadonlyArray<MilestoneItem>;
}
