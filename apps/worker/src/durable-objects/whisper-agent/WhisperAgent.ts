import { Agent } from "agents";
import { Cause, Context, Data, Effect, Exit, Layer, Option, Tracer } from "effect";
import type { SurfaceContext } from "@whisper/api";
import { Observability } from "../../observability/observability";
import type { WarmupMetadata } from "../../modules/whisper-session/domain/warmup-metadata";
import type { MetaContext } from "../../modules/whisper-session/domain/meta-context";
import { resolveMetaContext } from "../../modules/whisper-session/domain/meta-context";
import type { RecordCompletionResult } from "../../modules/whisper-session/domain/transcription-piggyback";
import { UsageTracker, type UsageEntry } from "../../modules/usage/application/ports/usage-tracker";
import { UsageLive } from "../../modules/usage/infra/live";
import { DictionaryRepository } from "../../modules/dictionary/application/ports/dictionary-repository";
import { DictionaryRepositoryLive } from "../../modules/dictionary/infra/live";
import { collectDictionaryHints } from "../../modules/dictionary/domain/dictionary-hints";
import type { RecordUsageResult } from "../../modules/usage/domain/usage-analytics";
import {
  ABANDONED_SESSION_MAX_AGE_MS,
  INITIAL_WHISPER_SESSION_STATE,
  type SessionEntry,
  type WhisperSessionState,
} from "./state";
import { makeActionModeAgentLayer, makeWhisperAgentLayer } from "./infra/live";
import { makeAgentObservabilityLayer } from "./infra/observability";
import { runSessionPipeline, type RunSessionResult } from "./run-session-pipeline";
import { runActionPipeline, type RunActionPipelineInput } from "./run-action-pipeline";
import type { ActionResult } from "../../modules/action-mode/domain/action-result";
import { OtlpTracingLive } from "../../observability/tracing";

class SessionForbiddenError extends Data.TaggedError("SessionForbiddenError")<{
  readonly message: string;
}> {}

class SessionNotFoundError extends Data.TaggedError("SessionNotFoundError")<{
  readonly message: string;
}> {}

class SessionPipelineError extends Data.TaggedError("SessionPipelineError")<{
  readonly message: string;
  readonly internal: {
    readonly userId: string;
    readonly sessionId: string;
    readonly cause: string;
  };
}> {}

export interface StartSessionInput {
  readonly userId: string;
  readonly sessionId: string;
  readonly metadata: WarmupMetadata;
  readonly startedAt: number;
}

export interface RunSessionInput {
  readonly userId: string;
  readonly sessionId: string;
  readonly audio: ArrayBuffer;
  readonly contentType: string;
  readonly locale: string;
  readonly skillMarkdown: string | null;
  readonly timezone: string;
  readonly language: string | null;
  readonly platform: "desktop" | "extension";
  readonly os: string;
  readonly surfaceContext: SurfaceContext | null;
  readonly traceContext?: {
    readonly traceId: string;
    readonly spanId: string;
    readonly sampled: boolean;
  };
}

export interface GetRewardsInput {
  readonly userId: string;
  readonly sessionId: string;
}

export interface RunActionModeInput extends RunActionPipelineInput {
  readonly traceContext?: {
    readonly traceId: string;
    readonly spanId: string;
    readonly sampled: boolean;
  };
}

class ActionPipelineError extends Data.TaggedError("ActionPipelineError")<{
  readonly message: string;
  readonly internal: {
    readonly userId: string;
    readonly cause: string;
  };
}> {}

const mapUsageResultToRewards = (result: RecordUsageResult): RecordCompletionResult => ({
  unlockedAchievements: result.unlockedAchievements.map((a) => a.key),
  unlockedMilestones: result.unlockedMilestones.map((m) => m.key),
  stats: result.stats,
});

// Worker -> Agent contract. No `@callable()` and no `/agents/*` route are wired,
// so these methods are reachable only via Durable Object RPC from the Worker —
// the frontend cannot invoke the agent directly.
export class WhisperAgent extends Agent<Env, WhisperSessionState> {
  override initialState: WhisperSessionState = INITIAL_WHISPER_SESSION_STATE;

  // In-flight reward evaluations keyed by sessionId. In-memory only: after a DO
  // restart getRewards falls back to the persisted usageDraft and re-runs the
  // (idempotent) evaluation.
  private readonly pendingRewards = new Map<string, Promise<RecordCompletionResult | null>>();

  private assertOwnership(userId: string): void {
    if (this.state.userId && this.state.userId !== userId) {
      throw new SessionForbiddenError({ message: "forbidden" });
    }
  }

  private evictAbandoned(
    sessions: Record<string, SessionEntry>,
    now: number
  ): Record<string, SessionEntry> {
    return Object.fromEntries(
      Object.entries(sessions).filter(
        ([, entry]) => now - entry.createdAt <= ABANDONED_SESSION_MAX_AGE_MS
      )
    );
  }

  private buildTracedProgram(
    input: RunSessionInput,
    meta: MetaContext,
    prefetchedDictionaryHints: readonly string[] | null,
    obsLayer: Layer.Layer<Observability>
  ) {
    const mode = input.skillMarkdown ? "ForcedSkill" : "VoiceSkills";

    const pipeline = runSessionPipeline({
      userId: input.userId,
      sessionId: input.sessionId,
      audio: input.audio,
      contentType: input.contentType,
      locale: input.locale,
      forcedSkillMarkdown: input.skillMarkdown,
      timezone: input.timezone,
      language: input.language,
      platform: input.platform,
      os: input.os,
      surfaceContext: input.surfaceContext,
      prefetchedDictionaryHints,
      meta,
    }).pipe(
      Effect.withSpan("whisper-agent.run-session", {
        attributes: {
          "session.userId": input.userId,
          "session.id": input.sessionId,
          "session.mode": mode,
          "audio.bytes": input.audio.byteLength,
        },
      })
    );

    const program = Effect.flatMap(Observability, (obs) =>
      obs.ensureWideEventEmitted(pipeline)
    ).pipe(
      Effect.provide(
        Layer.mergeAll(makeWhisperAgentLayer(this.env), obsLayer, OtlpTracingLive(this.env))
      )
    );

    if (!input.traceContext) return program;

    const externalSpan: Tracer.ExternalSpan = {
      _tag: "ExternalSpan",
      spanId: input.traceContext.spanId,
      traceId: input.traceContext.traceId,
      sampled: input.traceContext.sampled,
      annotations: Context.empty(),
    };

    return program.pipe(Effect.provideService(Tracer.ParentSpan, externalSpan));
  }

  async startSession(input: StartSessionInput): Promise<void> {
    this.assertOwnership(input.userId);
    const now = Date.now();
    const sessions = this.evictAbandoned(this.state.sessions, now);
    const dictionaryHints = await this.prefetchDictionaryHints(input.userId);
    sessions[input.sessionId] = {
      metadata: input.metadata,
      createdAt: now,
      ...(dictionaryHints ? { dictionaryHints } : {}),
    };
    await this.setState({ userId: input.userId, sessions });
  }

  // Warmup runs while the user is still recording, so this round-trip is free;
  // doing it here keeps the dictionary D1 query off the transcribe hot path.
  private async prefetchDictionaryHints(userId: string): Promise<readonly string[] | null> {
    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const repo = yield* DictionaryRepository;
        const dictionary = yield* repo.getDictionary(userId);
        return collectDictionaryHints(dictionary);
      }).pipe(Effect.provide(DictionaryRepositoryLive(this.env)))
    );
    return Exit.match(exit, {
      onSuccess: (words) => words,
      onFailure: () => null,
    });
  }

  async runSession(input: RunSessionInput): Promise<RunSessionResult> {
    this.assertOwnership(input.userId);

    const entry = this.state.sessions[input.sessionId];

    // Idempotent replay: a completed session returns its stored result without
    // re-running the pipeline, so a retried transcribe never double-counts usage.
    if (entry?.result) return entry.result;

    // A valid session must have been registered by warmup. Missing means it was
    // never warmed or already evicted — a terminal error, not a generic
    // transcription with empty metadata.
    if (!entry) {
      throw new SessionNotFoundError({ message: `session_not_found: ${input.sessionId}` });
    }

    const meta = resolveMetaContext(entry.metadata);
    const obsLayer = makeAgentObservabilityLayer(this.env, "agent.run_session", {
      userId: input.userId,
      sessionId: input.sessionId,
    });

    const exit = await Effect.runPromiseExit(
      this.buildTracedProgram(input, meta, entry.dictionaryHints ?? null, obsLayer)
    );

    if (Exit.isSuccess(exit)) {
      const { usageDraft, ...result } = exit.value;
      // Persist the result so retries replay it. The entry is bounded by
      // evict-on-write (createdAt-based) on the next warmup for this user.
      await this.completeSession(input.sessionId, result, usageDraft);
      // Rewards are evaluated off the hot path: the transcript returns now and
      // clients pick the outcome up via the session events stream.
      void this.startRewardEvaluation(input.userId, input.sessionId, usageDraft);
      return result;
    }

    // Keep the session entry on failure so the client can retry with the same
    // warmup metadata; the failed attempt recorded no usage. The wide event was
    // already emitted by ensureWideEventEmitted with the structured cause, so we
    // do not log again — we rethrow the typed failure (preserving its tag) or
    // wrap a defect so the caller never receives an opaque pretty-printed cause.
    const failure = Cause.findErrorOption(exit.cause);
    throw Option.getOrElse(
      failure,
      () =>
        new SessionPipelineError({
          message: "agent_run_session_failed",
          internal: {
            userId: input.userId,
            sessionId: input.sessionId,
            cause: Cause.pretty(exit.cause),
          },
        })
    );
  }

  // Action Mode: a single-call pipeline (no warmup, no session entry, no replay).
  // The desktop makes exactly one attempt and surfaces failures without retrying,
  // so usage cannot double-count. Quota was already checked by the Worker-side
  // ActionModeService before this RPC, mirroring warmup's division of duties.
  async runActionMode(input: RunActionModeInput): Promise<ActionResult> {
    this.assertOwnership(input.userId);

    const obsLayer = makeAgentObservabilityLayer(this.env, "agent.run_action_mode", {
      userId: input.userId,
    });

    const { traceContext, ...pipelineInput } = input;

    const pipeline = runActionPipeline(pipelineInput).pipe(
      Effect.withSpan("whisper-agent.run-action-mode", {
        attributes: {
          "session.userId": input.userId,
          "audio.bytes": input.audio.byteLength,
          "action_mode.hasSelectedText": input.selectedText !== null,
        },
      })
    );

    let program = Effect.flatMap(Observability, (obs) => obs.ensureWideEventEmitted(pipeline)).pipe(
      Effect.provide(
        Layer.mergeAll(makeActionModeAgentLayer(this.env), obsLayer, OtlpTracingLive(this.env))
      )
    );

    if (traceContext) {
      const externalSpan: Tracer.ExternalSpan = {
        _tag: "ExternalSpan",
        spanId: traceContext.spanId,
        traceId: traceContext.traceId,
        sampled: traceContext.sampled,
        annotations: Context.empty(),
      };
      program = program.pipe(Effect.provideService(Tracer.ParentSpan, externalSpan));
    }

    const exit = await Effect.runPromiseExit(program);

    if (Exit.isSuccess(exit)) {
      const { usageDraft, ...result } = exit.value;
      this.recordActionUsage(input.userId, usageDraft);
      return result;
    }

    const failure = Cause.findErrorOption(exit.cause);
    throw Option.getOrElse(
      failure,
      () =>
        new ActionPipelineError({
          message: "agent_run_action_mode_failed",
          internal: {
            userId: input.userId,
            cause: Cause.pretty(exit.cause),
          },
        })
    );
  }

  // Usage recording runs off the hot path: the transformed text returns now and
  // the ledger write happens under waitUntil. recordUsage is idempotent by id, and
  // a failed write only loses one stat entry — never the user's result.
  private recordActionUsage(userId: string, usageDraft: UsageEntry): void {
    const program = Effect.gen(function* () {
      const tracker = yield* UsageTracker;
      return yield* tracker.record(usageDraft);
    }).pipe(Effect.provide(UsageLive(this.env, userId)));

    const evaluation = Effect.runPromiseExit(program).then((exit) => {
      if (Exit.isFailure(exit)) {
        Effect.runFork(
          Effect.logError("whisper-agent.action-usage-recording failed", {
            actionId: usageDraft.id,
            cause: exit.cause,
          })
        );
      }
    });
    this.ctx.waitUntil(evaluation);
  }

  private async completeSession(
    sessionId: string,
    result: RunSessionResult,
    usageDraft: UsageEntry
  ): Promise<void> {
    const entry = this.state.sessions[sessionId];
    if (!entry) return;
    const sessions = {
      ...this.state.sessions,
      [sessionId]: { ...entry, result, usageDraft, completedAt: Date.now() },
    };
    await this.setState({ ...this.state, sessions });
  }

  async getRewards(input: GetRewardsInput): Promise<RecordCompletionResult | null> {
    this.assertOwnership(input.userId);
    const entry = this.state.sessions[input.sessionId];
    if (!entry) return null;
    if (entry.rewards !== undefined) return entry.rewards;

    const pending = this.pendingRewards.get(input.sessionId);
    if (pending) return pending;

    // Evaluation was lost (DO restarted between transcribe and this call):
    // re-run it from the persisted draft — recordUsage is idempotent by id.
    if (entry.usageDraft) {
      return this.startRewardEvaluation(input.userId, input.sessionId, entry.usageDraft);
    }
    return null;
  }

  private startRewardEvaluation(
    userId: string,
    sessionId: string,
    usageDraft: UsageEntry
  ): Promise<RecordCompletionResult | null> {
    const existing = this.pendingRewards.get(sessionId);
    if (existing) return existing;

    const evaluation = this.evaluateRewards(userId, sessionId, usageDraft).finally(() => {
      this.pendingRewards.delete(sessionId);
    });
    this.pendingRewards.set(sessionId, evaluation);
    this.ctx.waitUntil(evaluation);
    return evaluation;
  }

  private async evaluateRewards(
    userId: string,
    sessionId: string,
    usageDraft: UsageEntry
  ): Promise<RecordCompletionResult | null> {
    const program = Effect.gen(function* () {
      const tracker = yield* UsageTracker;
      return yield* tracker.record(usageDraft);
    }).pipe(Effect.provide(UsageLive(this.env, userId)));

    const exit = await Effect.runPromiseExit(program);
    const rewards = Exit.match(exit, {
      onSuccess: (result): RecordCompletionResult | null => mapUsageResultToRewards(result),
      onFailure: (cause): RecordCompletionResult | null => {
        Effect.runFork(
          Effect.logError("whisper-agent.reward-evaluation failed", { sessionId, cause })
        );
        return null;
      },
    });
    await this.persistRewards(sessionId, rewards);
    return rewards;
  }

  private async persistRewards(
    sessionId: string,
    rewards: RecordCompletionResult | null
  ): Promise<void> {
    const entry = this.state.sessions[sessionId];
    if (!entry) return;
    const sessions = {
      ...this.state.sessions,
      [sessionId]: { ...entry, rewards },
    };
    await this.setState({ ...this.state, sessions });
  }
}
