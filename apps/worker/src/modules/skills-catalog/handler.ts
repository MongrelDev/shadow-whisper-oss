import { Hono } from "hono";
import { Effect } from "effect";
import {
  BuildSkillBody,
  CreateSkillBody,
  UpdateSkillBody,
  ExecuteSkillBody,
  StringIdParam,
  effectJson,
  effectParam,
} from "@whisper/api";
import { currentUserId } from "../auth/application/current-user";
import { enforceUserRateLimit } from "../../lib/rate-limit-effect";
import { httpRateLimited, httpUnauthorized } from "../../lib/http-errors";
import { runSkillsCatalogHandler } from "./runtime";
import { SkillHttp } from "./http-errors";
import { SkillCatalogQueries } from "./application/skill-catalog-queries";
import { SkillInstaller } from "./application/skill-installer";
import { SkillSyncExecutor } from "./application/skill-sync-executor";
import { SkillBuilder } from "./application/ports/skill-builder";
import { CustomSkillManager } from "./application/custom-skill-manager";
import type { CustomSkill } from "./domain/custom-skill";

function toSkillResponse(custom: CustomSkill) {
  return {
    id: custom.id,
    slug: custom.slug,
    displayName: custom.displayName,
    description: custom.description,
    markdown: custom.markdown,
    triggers: [...custom.triggers],
    source: "custom" as const,
    isInstalled: true,
    createdAt: custom.createdAt,
    updatedAt: custom.updatedAt,
  };
}

const skills = new Hono<{ Bindings: Env }>()
  .get("/", (c) => {
    const http = SkillHttp(c);
    const unauthorized = httpUnauthorized(c);
    return runSkillsCatalogHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        const queries = yield* SkillCatalogQueries;
        const items = yield* queries.list({ userId });
        return c.json({ skills: items.map((s) => ({ ...s })) });
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          SkillInstallationError: http.internal,
          SkillDatabaseError: http.database,
        })
      ),
      "skills.list"
    );
  })
  .post("/build", effectJson(BuildSkillBody, "Invalid build body"), (c) => {
    const { description } = c.req.valid("json");
    const http = SkillHttp(c);
    const unauthorized = httpUnauthorized(c);
    const rateLimited = httpRateLimited(c);
    return runSkillsCatalogHandler(
      c,
      Effect.gen(function* () {
        yield* currentUserId;
        yield* enforceUserRateLimit("skills.build", ["RATE_LIMIT_10_PER_MIN"]);
        const builder = yield* SkillBuilder;
        const result = yield* builder.build({ description });
        return c.json(result);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          RateLimitedError: rateLimited,
          SkillExecutionError: http.executionFailed,
        })
      ),
      "skills.build"
    );
  })
  .post("/", effectJson(CreateSkillBody, "Invalid create body"), (c) => {
    const body = c.req.valid("json");
    const http = SkillHttp(c);
    const unauthorized = httpUnauthorized(c);
    const rateLimited = httpRateLimited(c);
    return runSkillsCatalogHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        yield* enforceUserRateLimit("skills.create", ["RATE_LIMIT_10_PER_MIN"]);
        const manager = yield* CustomSkillManager;
        const created = yield* manager.create({ userId, ...body });
        return c.json({ skill: toSkillResponse(created) }, 201);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          RateLimitedError: rateLimited,
          SkillDatabaseError: http.database,
        })
      ),
      "skills.create"
    );
  })
  .put(
    "/:id",
    effectParam(StringIdParam, "Invalid id"),
    effectJson(UpdateSkillBody, "Invalid update body"),
    (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const http = SkillHttp(c);
      const unauthorized = httpUnauthorized(c);
      const rateLimited = httpRateLimited(c);
      return runSkillsCatalogHandler(
        c,
        Effect.gen(function* () {
          const userId = yield* currentUserId;
          yield* enforceUserRateLimit("skills.update", ["RATE_LIMIT_10_PER_MIN"]);
          const manager = yield* CustomSkillManager;
          const updated = yield* manager.update({ userId, id, ...body });
          return c.json({ skill: toSkillResponse(updated) });
        }).pipe(
          Effect.catchTags({
            UnauthorizedError: unauthorized,
            RateLimitedError: rateLimited,
            SkillNotFoundError: http.notFound,
            SkillDatabaseError: http.database,
          })
        ),
        "skills.update"
      );
    }
  )
  .delete("/:id", effectParam(StringIdParam, "Invalid id"), (c) => {
    const { id } = c.req.valid("param");
    const http = SkillHttp(c);
    const unauthorized = httpUnauthorized(c);
    const rateLimited = httpRateLimited(c);
    return runSkillsCatalogHandler(
      c,
      Effect.gen(function* () {
        const userId = yield* currentUserId;
        yield* enforceUserRateLimit("skills.delete", ["RATE_LIMIT_10_PER_MIN"]);
        const manager = yield* CustomSkillManager;
        yield* manager.remove(userId, id);
        return c.json({ deleted: true as const });
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          RateLimitedError: rateLimited,
          SkillDatabaseError: http.database,
        })
      ),
      "skills.delete"
    );
  })
  .post(
    "/:id/execute-sync",
    effectParam(StringIdParam, "Invalid id"),
    effectJson(ExecuteSkillBody, "Invalid execute body"),
    (c) => {
      const { id } = c.req.valid("param");
      const { inputText, os, timezone, language } = c.req.valid("json");
      const http = SkillHttp(c);
      const unauthorized = httpUnauthorized(c);
      const rateLimited = httpRateLimited(c);
      return runSkillsCatalogHandler(
        c,
        Effect.gen(function* () {
          yield* enforceUserRateLimit("skills.execute-sync", ["RATE_LIMIT_10_PER_MIN"]);
          const userId = yield* currentUserId;
          const service = yield* SkillSyncExecutor;
          const result = yield* service.execute({
            userId,
            skillId: id,
            inputText,
            os,
            timezone,
            language,
          });
          return c.json(result, 200);
        }).pipe(
          Effect.catchTags({
            UnauthorizedError: unauthorized,
            RateLimitedError: rateLimited,
            SkillNotFoundError: http.notFound,
            SkillLoaderError: http.internal,
            SkillSyncExecutionError: http.executionFailed,
            SkillDatabaseError: http.database,
            UnknownError: http.internal,
          })
        ),
        "skills.execute-sync"
      );
    }
  )
  .post("/:id/install", effectParam(StringIdParam, "Invalid id"), (c) => {
    const { id } = c.req.valid("param");
    const http = SkillHttp(c);
    const unauthorized = httpUnauthorized(c);
    const rateLimited = httpRateLimited(c);
    return runSkillsCatalogHandler(
      c,
      Effect.gen(function* () {
        yield* enforceUserRateLimit("skills.install", ["RATE_LIMIT_10_PER_MIN"]);
        const userId = yield* currentUserId;
        const installer = yield* SkillInstaller;
        yield* installer.install({ userId, skillId: id });
        return c.json({ installed: true }, 201);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          RateLimitedError: rateLimited,
          SkillNotFoundError: http.notFound,
          SkillInstallationError: http.internal,
        })
      ),
      "skills.install"
    );
  })
  .delete("/:id/install", effectParam(StringIdParam, "Invalid id"), (c) => {
    const { id } = c.req.valid("param");
    const http = SkillHttp(c);
    const unauthorized = httpUnauthorized(c);
    const rateLimited = httpRateLimited(c);
    return runSkillsCatalogHandler(
      c,
      Effect.gen(function* () {
        yield* enforceUserRateLimit("skills.uninstall", ["RATE_LIMIT_10_PER_MIN"]);
        const userId = yield* currentUserId;
        const installer = yield* SkillInstaller;
        yield* installer.uninstall({ userId, skillId: id });
        return c.json({ installed: false }, 200);
      }).pipe(
        Effect.catchTags({
          UnauthorizedError: unauthorized,
          RateLimitedError: rateLimited,
          SkillInstallationError: http.internal,
        })
      ),
      "skills.uninstall"
    );
  });

export default skills;
