import { Hono } from "hono";
import { validator } from "hono/validator";
import type {
  AddSnippetBody,
  AddWordBody,
  AffiliateSignupBody,
  BuildSkillBody,
  CheckoutVerifyQuery,
  CleanupFeedbackBody,
  CreateSkillBody,
  DailyBreakdownQuery,
  EmailStatusBody,
  ExecuteSkillBody,
  GoogleTokenBody,
  GuestTransformBody,
  GuestTranscribeForm,
  IngestTeachBody,
  SessionWarmupBody,
  StringIdParam,
  UpdateSkillBody,
  WhisperWarmupBody,
} from "./schemas";
import type {
  AchievementsResponse,
  BuildSkillResponse,
  CheckoutTokenResponse,
  CheckoutVerificationResponse,
  CreateSkillResponse,
  DailyBreakdownResponse,
  DeleteSkillResponse,
  Dictionary,
  DictionaryWord,
  EmailStatusResponse,
  HealthResponse,
  PlanInfo,
  SessionWarmupResponse,
  Snippet,
  SubscriptionStatus,
  UpdateSkillResponse,
  ShareCardStatsResponse,
  UserStatsResponse,
  WhisperWarmupResponse,
  AffiliateProfileResponse,
  AffiliateDashboard,
  AffiliateSignupResponse,
  GuestSkillsResponse,
  GuestTranscribeResponse,
  GuestSkillResponse,
  GuestWarmupResponse,
  GoogleTokenResponse,
  MutationSuccessResponse,
  PendingSuggestionsListResponse,
  Skill,
  SkillInstallationResponse,
  SkillListResponse,
  ExecuteSkillSyncResponse,
  IngestTeachResponse,
} from "./types";

const jsonBody = <T>() => validator("json", (value) => value as T);
const routeParam = <T>() => validator("param", (value) => value as T);
const routeQuery = <T>() => validator("query", (value) => value as T);

const ok = { success: true } as const;
// The API contract must be assignable from both Worker and non-Worker Hono environments.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const contract = () => new Hono<{ Bindings: any }>();

const health = contract().get("/", (c) =>
  c.json({ status: "ok", timestamp: 0 } satisfies HealthResponse)
);

const billing = contract()
  .get("/checkout/verify", routeQuery<CheckoutVerifyQuery>(), (c) =>
    c.json({
      active: false,
      plan: "free",
      status: "free",
      trialEnd: null,
    } satisfies CheckoutVerificationResponse)
  )
  .get("/plans", (c) => c.json([] as PlanInfo[]))
  .post("/checkout-token", (c) => c.json({ token: "" } satisfies CheckoutTokenResponse))
  .get("/status", (c) =>
    c.json({
      plan: "free",
      status: "free",
      displayStatus: "free",
      trialEnd: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      usage: { spokenWords: 0, transformedWords: 0, totalWords: 0, limit: 0 },
    } satisfies SubscriptionStatus)
  );

const guest = contract()
  .post("/warmup", (c) => c.json({ sessionId: "" } satisfies GuestWarmupResponse))
  .get("/skills", (c) =>
    c.json({
      transformers: [],
    } satisfies GuestSkillsResponse)
  );

const guestSessions = contract()
  .post(
    "/:sessionId/transcribe",
    validator("form", (value) => value as GuestTranscribeForm),
    (c) =>
      c.json({
        rawText: "",
        cleanText: "",
        durationMs: 0,
        wordCount: 0,
      } satisfies GuestTranscribeResponse)
  )
  .post("/:sessionId/skills", jsonBody<GuestTransformBody>(), (c) =>
    c.json({ cleanText: "", wordCount: 0 } satisfies GuestSkillResponse)
  );

const dictionary = contract()
  .get("/", (c) => c.json({ words: [], snippets: [] } satisfies Dictionary))
  .post("/words", jsonBody<AddWordBody>(), (c) =>
    c.json({ id: 0, word: "", createdAt: 0 } satisfies DictionaryWord, 201)
  )
  .delete("/words/:id", routeParam<StringIdParam>(), (c) => c.json(ok))
  .post("/snippets", jsonBody<AddSnippetBody>(), (c) =>
    c.json({ id: 0, triggerPhrase: "", expandedText: "", createdAt: 0 } satisfies Snippet, 201)
  )
  .delete("/snippets/:id", routeParam<StringIdParam>(), (c) => c.json(ok));

const skillStub: Skill = {
  id: "",
  slug: "",
  displayName: "",
  description: null,
  triggers: [],
  markdown: null,
  source: "official",
  isInstalled: false,
  createdAt: null,
  updatedAt: null,
};

const customSkillStub: Skill & { markdown: string } = {
  ...skillStub,
  source: "custom",
  markdown: "",
  isInstalled: true,
};

const skills = contract()
  .get("/", (c) => c.json({ skills: [] } satisfies SkillListResponse))
  .post("/build", jsonBody<BuildSkillBody>(), (c) =>
    c.json({
      displayName: "",
      description: "",
      slug: "",
      triggers: [],
      markdown: "",
    } satisfies BuildSkillResponse)
  )
  .post("/", jsonBody<CreateSkillBody>(), (c) =>
    c.json({ skill: customSkillStub } satisfies CreateSkillResponse, 201)
  )
  .put("/:id", routeParam<StringIdParam>(), jsonBody<UpdateSkillBody>(), (c) =>
    c.json({ skill: customSkillStub } satisfies UpdateSkillResponse)
  )
  .delete("/:id", routeParam<StringIdParam>(), (c) =>
    c.json({ deleted: true } satisfies DeleteSkillResponse)
  )
  .post("/:id/execute-sync", routeParam<StringIdParam>(), jsonBody<ExecuteSkillBody>(), (c) =>
    c.json({ executionId: "", cleanText: "", wordCount: 0 } satisfies ExecuteSkillSyncResponse)
  )
  .post("/:id/install", routeParam<StringIdParam>(), (c) =>
    c.json({ installed: true } satisfies SkillInstallationResponse, 201)
  )
  .delete("/:id/install", routeParam<StringIdParam>(), (c) =>
    c.json({ installed: false } satisfies SkillInstallationResponse, 200)
  );

const whisperApi = contract().post("/warmup", jsonBody<WhisperWarmupBody>(), (c) =>
  c.json({ sessionId: "", wsUrl: "" } satisfies WhisperWarmupResponse)
);

const usageApi = contract()
  .get("/daily", routeQuery<DailyBreakdownQuery>(), (c) =>
    c.json({ from: "", to: "", items: [], achievementDates: [] } satisfies DailyBreakdownResponse)
  )
  .get("/achievements", (c) => c.json({ items: [] } satisfies AchievementsResponse))
  .get("/stats", (c) =>
    c.json({
      currentStreak: 0,
      weeklyAvgWpm: 0,
      totalWords: 0,
      isFirstWeek: false,
      hasAnyEntries: false,
      achievements: [],
      milestones: [],
    } satisfies UserStatsResponse)
  )
  .get("/share-card", (c) =>
    c.json({
      totalWords: 0,
      totalDuration: 0,
      totalTranscriptions: 0,
      weeklyAvgWpm: 0,
      currentStreak: 0,
      maxStreak: 0,
      memberSince: null,
      personalBestWpm: 0,
      distinctSkillsAllTime: 0,
      distinctLanguagesAllTime: 0,
      achievements: [],
      milestones: [],
    } satisfies ShareCardStatsResponse)
  );

const sessionsApi = contract().post("/warmup", jsonBody<SessionWarmupBody>(), (c) =>
  c.json({ sessionId: "" } satisfies SessionWarmupResponse)
);

const suggestionsApi = contract()
  .get("/pending", (c) => c.json({ suggestions: [] } satisfies PendingSuggestionsListResponse))
  .post("/:id/accept", routeParam<StringIdParam>(), (c) =>
    c.json(ok satisfies MutationSuccessResponse)
  )
  .post("/:id/reject", routeParam<StringIdParam>(), (c) =>
    c.json(ok satisfies MutationSuccessResponse)
  );

const authExtras = contract()
  .post("/email-status", jsonBody<EmailStatusBody>(), (c) =>
    c.json({ verified: false } satisfies EmailStatusResponse)
  )
  .post("/extension/google/token", jsonBody<GoogleTokenBody>(), (c) =>
    c.json({ idToken: "", accessToken: "" } satisfies GoogleTokenResponse)
  );

const teach = contract().post("/", jsonBody<IngestTeachBody>(), (c) =>
  c.json(
    {
      feedbackId: "",
      instanceId: null,
    } satisfies IngestTeachResponse,
    202
  )
);

const feedbackApi = contract().post("/cleanup", jsonBody<CleanupFeedbackBody>(), (c) =>
  c.json(ok satisfies MutationSuccessResponse)
);

const affiliateApi = contract()
  .get("/status", (c) => c.json({ enabled: false }))
  .post("/signup", jsonBody<AffiliateSignupBody>(), (c) =>
    c.json(
      {
        success: true,
        trialDays: 0,
      } satisfies AffiliateSignupResponse,
      201
    )
  )
  .get("/profile", (c) =>
    c.json({
      code: "",
      isActive: true,
      createdAt: "",
      eligibility: { canParticipate: false, reason: "missing_active_subscription" },
    } satisfies AffiliateProfileResponse)
  )
  .get("/dashboard", (c) =>
    c.json({
      profile: {
        code: "",
        isActive: true,
        createdAt: "",
        eligibility: { canParticipate: false, reason: "missing_active_subscription" },
      },
      stats: {
        totalReferrals: 0,
        grantedRewardDays: 0,
      },
      referrals: [],
    } satisfies AffiliateDashboard)
  );

export const routes = contract()
  .route("/health", health)
  .route("/billing", billing)
  .route("/api/guest", guest)
  .route("/api/guest/sessions", guestSessions)
  .route("/dictionary", dictionary)
  .route("/skills", skills)
  .route("/affiliate", affiliateApi)
  .route("/api/whisper", whisperApi)
  .route("/api/sessions", sessionsApi)
  .route("/api/usage", usageApi)
  .route("/api/feedback", feedbackApi)
  .route("/teach", teach)
  .route("/suggestions", suggestionsApi)
  .route("/auth", authExtras);

export type AppType = typeof routes;
