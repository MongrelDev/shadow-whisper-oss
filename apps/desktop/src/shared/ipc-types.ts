import type {
  AchievementKey,
  MilestoneKey,
  AffiliateDashboard,
  AffiliateProfileResponse,
  ApiResult,
  BuildSkillBody,
  BuildSkillResponse,
  CreateSkillBody,
  CreateSkillResponse,
  UpdateSkillBody,
  UpdateSkillResponse,
  DeleteSkillResponse,
  DailyBreakdownResponse,
  Dictionary,
  DictionaryWord,
  PendingSuggestionsListResponse,
  PlanInfo,
  ShareCardStatsResponse,
  Skill,
  Snippet,
  SubscriptionStatus,
  SurfaceContext,
  UserStatsResponse,
} from "@whisper/api";

export type {
  AffiliateDashboard,
  AffiliateProfileResponse,
  AffiliateReferralItem,
  ApiResult,
  DailyBreakdownResponse,
  Dictionary,
  DictionaryWord,
  DisplayStatus,
  BuildSkillBody,
  BuildSkillResponse,
  CreateSkillBody,
  CreateSkillResponse,
  UpdateSkillBody,
  UpdateSkillResponse,
  DeleteSkillResponse,
  PendingSuggestionResponse,
  PendingSuggestionsListResponse,
  PlanInfo,
  PlanFeatureKey,
  PlanPrice,
  Plan,
  ReferralStatus,
  ShareCardStatsResponse,
  SessionWarmupAppContext,
  Skill,
  Snippet,
  SubscriptionStatus,
  SurfaceContext,
  UserStatsResponse,
} from "@whisper/api";

// ─── Shared Data Types ────────────────────────────────────────────────

export const APP_THEMES = ["light", "dark", "system"] as const;
export type AppTheme = (typeof APP_THEMES)[number];

export const USE_CASE_IDS = [
  "emails",
  "messages",
  "long-form",
  "short-form",
  "ai-prompting",
] as const;
export type UseCaseId = (typeof USE_CASE_IDS)[number];

export const APP_LOCALES = ["en", "pt-BR"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export interface NudgeSkillDiscoveryData {
  eligibleAt: string | null;
  lastShownAt: string | null;
  lastClickedAt: string | null;
  timesShown: number;
  successfulTranscriptionCount: number;
}

export interface NudgeCleanupDiffData {
  eligibleAt: string | null;
  lastShownAt: string | null;
  lastClickedAt: string | null;
  timesShown: number;
}

export interface AppConfigData {
  shortcuts: {
    transcription: string;
    pasteLastTranscript: string;
    cancelRecording: string;
    viewLastDiff: string;
  };
  preferences: {
    theme: AppTheme;
    locale: AppLocale;
    selectedLanguages: string[];
    launchAtLogin: boolean;
    notifications: boolean;
    onboardingCompleted: boolean;
    seenTourSteps: string[];
    privacyMode: boolean;
    useCases: UseCaseId[];
    audio: {
      enableSounds: boolean;
      shouldMuteAudio: boolean;
      soundFolder: string | false;
      inputDeviceId: string | false;
      outputDeviceId: string | false;
      localAudioRetention: boolean;
    };
  };
  ui: { sidebarCollapsed: boolean };
  skills: {
    shortcuts: Record<string, string>;
    successfulExecutionCount: number;
  };
  nudges: {
    skillDiscovery: NudgeSkillDiscoveryData;
    cleanupDiff: NudgeCleanupDiffData;
  };
  autoTeachEnabled: boolean;
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type AppConfigPatch = DeepPartial<AppConfigData>;

export type InteractionMode =
  | "idle"
  | "capturing-shortcut"
  | "recording-audio"
  | "processing-transcription"
  | "running-skill";

export interface ShortcutConfigData {
  transcription: string;
  pasteLastTranscript: string;
  cancelRecording: string;
  teach: string;
  viewLastDiff: string;
}

// ─── Tooltip Types ───────────────────────────────────────────────────

export type TooltipData =
  | { type: "text"; text: string }
  | { type: "shortcut"; label: string; keys: string[] };

// ─── Namespaced API Interfaces ────────────────────────────────────────

export interface BadgeUnlockPayload {
  eventId: string;
  unlockedAchievements?: ReadonlyArray<AchievementKey>;
  unlockedMilestones?: ReadonlyArray<MilestoneKey>;
}

export interface RecordingAPI {
  notifyStarted: () => void;
  notifyStopped: () => void;
  onStart: (callback: () => void) => () => void;
  onStop: (callback: () => void) => () => void;
  onCancelShortcut: (callback: () => void) => () => void;
  showWindow: () => void;
  hideWindow: () => void;
  cancel: () => void;
  setIgnoreMouseEvents: (ignore: boolean) => void;
  toggle: () => void;
  onBadgeUnlock: (callback: (payload: BadgeUnlockPayload) => void) => () => void;
  notifyCelebrationDone: () => void;
  onSkillApplying: (callback: (active: boolean) => void) => () => void;
  onViewLastDiff: (callback: () => void) => () => void;
}

export interface TranscriptionAPI {
  insert: (text: string) => Promise<{ success: boolean; notice?: string }>;
  seedLastText: (text: string) => void;
}

export interface ConfigAPI {
  get: () => Promise<ApiResult<AppConfigData>>;
  set: (patch: AppConfigPatch) => Promise<ApiResult>;
  reset: () => Promise<ApiResult>;
  onCorrupt: (callback: (errors: string) => void) => () => void;
}

export interface ShortcutsAPI {
  get: () => Promise<ApiResult<ShortcutConfigData>>;
  set: (key: string, accelerator: string) => Promise<ApiResult>;
  onChanged: (callback: () => void) => () => void;
}

export interface DictionaryAPI {
  get: () => Promise<ApiResult<Dictionary>>;
  addWord: (word: string) => Promise<ApiResult<DictionaryWord>>;
  removeWord: (id: number) => Promise<ApiResult>;
  addSnippet: (trigger: string, expanded: string) => Promise<ApiResult<Snippet>>;
  removeSnippet: (id: number) => Promise<ApiResult>;
}

export interface SkillsAPI {
  list: () => Promise<ApiResult<Skill[]>>;
  install: (id: string) => Promise<ApiResult>;
  uninstall: (id: string) => Promise<ApiResult>;
  setShortcut: (
    skillId: string,
    accelerator: string | null
  ) => Promise<{ success: boolean; error?: string }>;
}

export interface SkillBuilderAPI {
  build: (body: BuildSkillBody) => Promise<ApiResult<BuildSkillResponse>>;
  create: (body: CreateSkillBody) => Promise<ApiResult<CreateSkillResponse>>;
  update: (id: string, body: UpdateSkillBody) => Promise<ApiResult<UpdateSkillResponse>>;
  delete: (id: string) => Promise<ApiResult<DeleteSkillResponse>>;
}

export type WarmupIpcResult =
  | { ok: true; sessionId: string }
  | {
      ok: false;
      reason: "quota_exceeded" | "internal" | "network" | "unauthenticated";
    };

export type TranscribeSyncFailureReason =
  | "quota_exceeded"
  | "unauthenticated"
  | "network"
  | "internal"
  | "payload_too_large"
  | "transcription_failed";

export interface TranscribePiggybackStats {
  todayWordCount: number;
  weekWordCount: number;
  currentStreak: number;
  wpm: number;
  totalWords: number;
  weeklyAvgWpm: number;
  isFirstWeek: boolean;
}

export type TranscribeSyncIpcResult =
  | {
      ok: true;
      sessionId: string;
      rawText: string;
      improvedText: string;
      sttEngine: string;
      durationMs: number;
    }
  | { ok: false; reason: TranscribeSyncFailureReason; message?: string };

export interface SessionRewardsPushPayload {
  stats: TranscribePiggybackStats;
  unlockedAchievements?: ReadonlyArray<AchievementKey>;
  unlockedMilestones?: ReadonlyArray<MilestoneKey>;
}

export interface TranscribeSyncIpcInput {
  sessionId: string;
  audioBuffer: ArrayBuffer;
  contentType: string;
  // `locale` is the STT language hint (e.g. "en-US"); distinct from `language` (UI locale / analytics).
  locale?: string;
  timezone: string;
  language: string | null;
  platform: "desktop";
  surfaceContext: SurfaceContext | null;
}

export interface SessionAPI {
  warmup: () => Promise<WarmupIpcResult>;
  transcribe: (input: TranscribeSyncIpcInput) => Promise<TranscribeSyncIpcResult>;
  onRewards: (callback: (payload: SessionRewardsPushPayload) => void) => () => void;
}

export interface SuggestionsAPI {
  getPending: () => Promise<ApiResult<PendingSuggestionsListResponse>>;
  accept: (id: string) => Promise<ApiResult<{ success: true }>>;
  reject: (id: string) => Promise<ApiResult<{ success: true }>>;
}

export type MicrophonePermissionStatus =
  | "granted"
  | "denied"
  | "restricted"
  | "not-determined"
  | "unknown";

export interface MicrophonePermissionResult {
  success: boolean;
  status?: MicrophonePermissionStatus;
  error?: string;
}

export interface SettingsAPI {
  show: () => void;
  hide: () => void;
  getMicrophonePermission: () => Promise<MicrophonePermissionResult>;
  checkMicrophoneStatus: () => Promise<boolean>;
  checkAccessibility: (prompt: boolean) => Promise<boolean>;
  getLaunchAtLogin: () => Promise<boolean>;
  setLaunchAtLogin: (enabled: boolean) => void;
  requestNotificationPermission: () => Promise<ApiResult>;
  checkNotificationSupport: () => Promise<boolean>;
  openMicrophonePrivacy: () => Promise<ApiResult>;
}

export interface AppAPI {
  version: () => Promise<string>;
  showMainWindow: () => void;
  openRoute: (route: string) => void;
  onNavigate: (callback: (payload: { route: string }) => void) => () => void;
}

export interface ShellAPI {
  openExternal: (url: string) => void;
}

export interface ClipboardAPI {
  write: (text: string) => void;
}

export interface DebugAPI {
  log: (...args: unknown[]) => void;
}

export interface UserAPI {
  getSubscriptionStatus: () => Promise<ApiResult<SubscriptionStatus>>;
  getPlans: () => Promise<ApiResult<PlanInfo[]>>;
}

export type AffiliateProfileWithUrl = AffiliateProfileResponse & { inviteUrl: string };

export interface AffiliateAPI {
  getStatus: () => Promise<ApiResult<{ enabled: boolean }>>;
  getProfile: () => Promise<ApiResult<AffiliateProfileWithUrl>>;
  getDashboard: () => Promise<ApiResult<AffiliateDashboard>>;
}

export interface UsageAPI {
  getDaily: (query: { from: string; to: string }) => Promise<ApiResult<DailyBreakdownResponse>>;
  getStats: () => Promise<ApiResult<UserStatsResponse>>;
  getShareCardStats: () => Promise<ApiResult<ShareCardStatsResponse>>;
}

export interface MaintenanceAPI {
  onCleanupExpiredAudio: (cb: () => void) => () => void;
}

export interface InteractionAPI {
  getMode: () => Promise<ApiResult<InteractionMode>>;
  setMode: (mode: InteractionMode, owner?: string) => Promise<ApiResult>;
  clearMode: (owner?: string) => Promise<ApiResult>;
}

export interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
}

export interface AuthActionError {
  message: string;
  code?: string;
  status?: number;
}

export type AuthActionResult = { ok: true } | { ok: false; error: AuthActionError };

export type PurchaseOrigin = "onboarding" | "billing" | "unknown";

export interface PurchaseDeepLinkPayload {
  token: string | null;
  from: PurchaseOrigin;
}

export interface AuthAPI {
  signOut: () => Promise<AuthActionResult>;
  getSession: () => Promise<AuthSessionUser | null>;
  onDebug: (
    callback: (payload: {
      event: string;
      details?: Record<string, unknown>;
      timestamp: string;
    }) => void
  ) => () => void;
  subscriptionUpgrade: (input: {
    plan: string;
    annual: boolean;
    successUrl: string;
    cancelUrl: string;
  }) => Promise<{ url: string | null; error?: AuthActionError }>;
  subscriptionBillingPortal: () => Promise<{ url: string | null; error?: AuthActionError }>;
  sendVerificationEmail: (input: {
    email: string;
    callbackURL: string;
  }) => Promise<AuthActionResult>;
  checkEmailStatus: (email: string) => Promise<{ verified: boolean; error?: AuthActionError }>;
  createCheckoutStatusToken: () => Promise<{ token: string | null; error?: AuthActionError }>;
  onPurchaseDeepLink: (callback: (payload: PurchaseDeepLinkPayload) => void) => () => void;
  relayAuthToPill: () => void;
  onSessionChanged: (callback: () => void) => () => void;
}

export interface CleanupFeedbackPayload {
  rating: "like" | "dislike";
  rawText: string;
  formattedText: string;
  language: string;
  wordCount: number;
  diffRatio: number;
  transcriptionCreatedAt: string;
  bundleId: string | null;
  host: string | null;
  appCategory: string | null;
  installedSkillCount: number | null;
}

export interface FeedbackAPI {
  sendCleanupFeedback: (payload: CleanupFeedbackPayload) => void;
}

// ─── Root API ─────────────────────────────────────────────────────────

export interface ElectronAPI {
  recording: RecordingAPI;
  transcription: TranscriptionAPI;
  config: ConfigAPI;
  shortcuts: ShortcutsAPI;
  dictionary: DictionaryAPI;
  skills: SkillsAPI;
  skillBuilder: SkillBuilderAPI;
  session: SessionAPI;
  suggestions: SuggestionsAPI;
  settings: SettingsAPI;
  app: AppAPI;
  shell: ShellAPI;
  clipboard: ClipboardAPI;
  debug: DebugAPI;
  user: UserAPI;
  affiliate: AffiliateAPI;
  usage: UsageAPI;
  maintenance: MaintenanceAPI;
  interaction: InteractionAPI;
  auth: AuthAPI;
  feedback: FeedbackAPI;
}
