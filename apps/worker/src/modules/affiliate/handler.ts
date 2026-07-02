import { Hono } from "hono";
import type { Context } from "hono";
import { Effect } from "effect";
import { AffiliateSignupBody, effectJson } from "@whisper/api";
import type { AffiliateSignupBody as AffiliateSignupBodyType } from "@whisper/api";
import type { ErrorResponse } from "@whisper/api";
import { currentUserId } from "../auth/application/current-user";
import { httpUnauthorized } from "../../lib/http-errors";
import { rateLimit } from "../../middleware/rate-limit";
import { requireFeatureFlag, isFeatureEnabled } from "../../middleware/feature-flag";
import { runAffiliateHandler } from "./runtime";
import { AffiliateService } from "./application/affiliate-service";
import { CodeGenerationError, AffiliateDatabaseError } from "./errors";

const AFFILIATE_FLAG = "affiliate";

const getSignupBody = (c: Context<{ Bindings: Env }>): AffiliateSignupBodyType =>
  c.req.valid("json" as never) as AffiliateSignupBodyType;

const affiliate = new Hono<{ Bindings: Env }>()
  .get("/status", async (c) => {
    const enabled = await isFeatureEnabled(c.env, AFFILIATE_FLAG);
    return c.json({ enabled });
  })

  .use(requireFeatureFlag(AFFILIATE_FLAG))

  .post(
    "/signup",
    effectJson(AffiliateSignupBody, "Dados de cadastro inválidos"),
    rateLimit("RATE_LIMIT_10_PER_MIN", (c) => {
      const { code } = getSignupBody(c);
      return `affiliate.signup:code:${code}`;
    }),
    rateLimit("RATE_LIMIT_10_PER_MIN", (c) => {
      const { code } = getSignupBody(c);
      const ip = c.req.header("CF-Connecting-IP") || "unknown";
      return `affiliate.signup:ip:${ip}:code:${code}`;
    }),
    async (c) => {
      const { name, email, password, code, callbackURL } = c.req.valid("json");

      return runAffiliateHandler(
        c,
        Effect.gen(function* () {
          const affiliate = yield* AffiliateService;
          return yield* affiliate.processSignup({
            affiliateCode: code,
            name,
            email,
            password,
            callbackURL,
          });
        }).pipe(
          Effect.map(({ trialDays }) => c.json({ success: true as const, trialDays }, 201)),
          Effect.catchTags({
            InvalidAffiliateCodeError: () =>
              Effect.succeed(
                c.json(
                  {
                    error_code: "er_invalid_affiliate_code",
                    details: { message: "Código de convite inválido ou expirado." },
                  } satisfies ErrorResponse<"er_invalid_affiliate_code", { message: string }>,
                  400
                )
              ),
            SelfReferralError: () =>
              Effect.succeed(
                c.json(
                  {
                    error_code: "er_self_referral",
                    details: {
                      message: "Você não pode usar seu próprio código de convite.",
                    },
                  } satisfies ErrorResponse<"er_self_referral", { message: string }>,
                  400
                )
              ),
            EmailAlreadyExistsError: () =>
              Effect.succeed(
                c.json(
                  {
                    error_code: "er_email_already_exists",
                    details: {
                      message:
                        "Este email já tem uma conta. Entre no app para usar convites existentes.",
                    },
                  } satisfies ErrorResponse<"er_email_already_exists", { message: string }>,
                  409
                )
              ),
            DisposableEmailError: () =>
              Effect.succeed(
                c.json(
                  {
                    error_code: "er_disposable_email",
                    details: {
                      message: "Disposable email addresses are not allowed.",
                    },
                  } satisfies ErrorResponse<"er_disposable_email", { message: string }>,
                  400
                )
              ),
            SignupError: (error) =>
              Effect.succeed(
                c.json(
                  {
                    error_code: "er_internal",
                    details: { message: error.message },
                  } satisfies ErrorResponse<"er_internal", { message: string }>,
                  500
                )
              ),
            DuplicateReferralError: () =>
              Effect.succeed(
                c.json(
                  {
                    error_code: "er_validation",
                    details: { message: "Referral already exists" },
                  } satisfies ErrorResponse<"er_validation", { message: string }>,
                  409
                )
              ),
            AffiliateDatabaseError: (error) =>
              Effect.succeed(
                c.json(
                  {
                    error_code: "er_database",
                    details: { message: error.message },
                  } satisfies ErrorResponse<"er_database", { message: string }>,
                  500
                )
              ),
          })
        ),
        "affiliate.signup"
      );
    }
  )

  .get("/profile", (c) => {
    const unauthorized = httpUnauthorized(c);

    return runAffiliateHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        const affiliate = yield* AffiliateService;
        const result = yield* affiliate.getOrCreateProfile({ userId });
        return c.json(result);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          AffiliateDatabaseError: (error: AffiliateDatabaseError) =>
            Effect.succeed(
              c.json(
                {
                  error_code: "er_database",
                  details: { message: error.message },
                } satisfies ErrorResponse<"er_database", { message: string }>,
                500
              )
            ),
          CodeGenerationError: (error: CodeGenerationError) =>
            Effect.succeed(
              c.json(
                {
                  error_code: "er_code_generation",
                  details: { message: error.message },
                } satisfies ErrorResponse<"er_code_generation", { message: string }>,
                500
              )
            ),
        })
      ),
      "affiliate.profile.get"
    );
  })

  .get("/dashboard", (c) => {
    const unauthorized = httpUnauthorized(c);

    return runAffiliateHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        const affiliate = yield* AffiliateService;
        const result = yield* affiliate.getDashboard({ userId });
        return c.json(result);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          AffiliateDatabaseError: (error) =>
            Effect.succeed(
              c.json(
                {
                  error_code: "er_database",
                  details: { message: error.message },
                } satisfies ErrorResponse<"er_database", { message: string }>,
                500
              )
            ),
        })
      ),
      "affiliate.dashboard.get"
    );
  });

export default affiliate;
