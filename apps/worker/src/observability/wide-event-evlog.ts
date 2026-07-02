import { Cause, Effect, Exit, Layer, Result } from "effect";
import type { RequestLogger } from "evlog";
import { createWorkersLogger, initWorkersLogger, type WorkerExecutionContext } from "evlog/workers";
import { createPostHogDrain } from "evlog/posthog";
import {
  WideEvent,
  type WideEventEnsureOptions,
  type WideEventFailureOptions,
  type WideEventFields,
  type WideEventService,
  type WideEventSuccessOptions,
  type WideEventValue,
} from "./wide-event";

let loggerInitialized = false;

const isProduction = (env: Env): boolean => env.ENVIRONMENT === "production";

export const initWideEventLogger = (env: Env): void => {
  if (loggerInitialized) return;
  loggerInitialized = true;
  initWorkersLogger({
    env: {
      service: "shadowwhisper-worker",
      environment: env.ENVIRONMENT,
    },
    drain: createPostHogDrain({ apiKey: env.POSTHOG_API_KEY }),
    ...(isProduction(env) && {
      sampling: {
        rates: {
          info: 20,
          warn: 50,
          debug: 0,
          error: 100,
        },
        keep: [
          { duration: 1000 },
          { path: "/api/auth/**" },
          { path: "/auth/**" },
          { path: "/api/sessions/**" },
          { path: "/api/guest/**" },
          { path: "/billing/**" },
        ],
      },
    }),
  });
};

export interface WideEventRequestOptions {
  readonly request: Request;
  readonly executionCtx?: WorkerExecutionContext;
  readonly requestId?: string;
  readonly baseFields?: WideEventFields;
}

const isPrimitive = (value: unknown): value is string | number | boolean =>
  typeof value === "string" || typeof value === "number" || typeof value === "boolean";

const normalizeArray = (value: readonly unknown[]): WideEventValue =>
  value
    .map((item) => normalizeValue(item))
    .filter((item): item is WideEventValue => item !== undefined);

const normalizeObject = (value: object): WideEventValue => {
  const entries = Object.entries(value).flatMap(([key, item]) => {
    const normalized = normalizeValue(item);
    return normalized === undefined ? [] : ([[key, normalized]] as const);
  });
  return Object.fromEntries(entries);
};

const normalizeByType = (value: unknown): WideEventValue => {
  if (isPrimitive(value)) return value;
  if (typeof value === "object" && value !== null) return normalizeObject(value);
  return String(value);
};

const normalizeValue = (value: unknown): WideEventValue | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return normalizeArray(value);
  return normalizeByType(value);
};

const normalizeFields = (fields?: WideEventFields): Record<string, WideEventValue> => {
  if (!fields) return {};
  const entries = Object.entries(fields).flatMap(([key, value]) => {
    const normalized = normalizeValue(value);
    return normalized === undefined ? [] : ([[key, normalized]] as const);
  });
  return Object.fromEntries(entries);
};

const extractCause = (cause: unknown): WideEventValue | undefined => {
  if (cause === undefined || cause === null) return undefined;
  if (typeof cause === "object") return normalizeValue(cause);
  return String(cause);
};

const extractTag = (error: object): string | undefined => {
  if (!("_tag" in error)) return undefined;
  const tag = (error as { _tag: unknown })._tag;
  return typeof tag === "string" ? tag : undefined;
};

const standardErrorKeys = new Set(["name", "message", "stack", "cause", "_tag"]);

const extractTaggedFields = (error: object): Record<string, WideEventValue> => {
  const entries = Object.keys(error).flatMap((key) => {
    if (standardErrorKeys.has(key)) return [];
    const normalized = normalizeValue((error as Record<string, unknown>)[key]);
    return normalized === undefined ? [] : ([[key, normalized]] as const);
  });
  return Object.fromEntries(entries);
};

const normalizeError = (error: unknown): Record<string, WideEventValue> => {
  if (error instanceof Error) {
    return {
      ...normalizeFields({
        kind: error.name,
        message: error.message,
        stack: error.stack,
        cause: extractCause(error.cause),
        tag: extractTag(error),
      }),
      ...extractTaggedFields(error),
    };
  }

  if (typeof error === "string") {
    return { message: error, kind: "Error" };
  }

  return normalizeFields({
    kind: typeof error,
    value: normalizeValue(error),
  });
};

const applySuccess = (
  logger: RequestLogger<Record<string, unknown>>,
  options?: WideEventSuccessOptions
): void => {
  logger.set({
    outcome: "success",
    responseStatus: options?.responseStatus,
    ...normalizeFields(options?.fields),
  });
};

const applyFailure = (
  logger: RequestLogger<Record<string, unknown>>,
  error: unknown,
  options?: WideEventFailureOptions
): void => {
  logger.set({
    outcome: "failure",
    responseStatus: options?.responseStatus,
    error: normalizeError(error),
    ...normalizeFields(options?.fields),
  });
};

const pickErrorFromCause = <E>(cause: Cause.Cause<E>): { error: unknown; isTyped: boolean } => {
  const failure = Cause.findErrorOption(cause);
  if (failure._tag === "Some") {
    return { error: failure.value, isTyped: true };
  }
  const defect = Cause.findDefect(cause);
  if (Result.isSuccess(defect)) {
    return { error: defect.success, isTyped: false };
  }
  return { error: cause, isTyped: false };
};

export const makeWideEvent = (options: WideEventRequestOptions): WideEventService => {
  const startedAt = Date.now();
  const logger = createWorkersLogger<Record<string, unknown>>(options.request, {
    executionCtx: options.executionCtx,
    requestId: options.requestId,
  });

  logger.set({
    ...normalizeFields(options.baseFields),
    event: "http.request",
  });

  let emitted = false;
  let lastResponseStatus: number | undefined;

  const emitOnce = (): void => {
    if (emitted) return;
    emitted = true;
    logger.emit({
      durationMs: Date.now() - startedAt,
      status: lastResponseStatus,
    });
  };

  const safe = (fn: () => void): Effect.Effect<void> =>
    Effect.try({
      try: fn,
      catch: () => undefined,
    }).pipe(Effect.ignore);

  const recordExitFailure = <A, E>(
    cause: Cause.Cause<E>,
    ensureOptions?: WideEventEnsureOptions<A, E>
  ): void => {
    const { error, isTyped } = pickErrorFromCause(cause);
    const failureOptions = isTyped ? ensureOptions?.onFailure?.(error as E) : undefined;
    lastResponseStatus = failureOptions?.responseStatus;
    applyFailure(logger, error, failureOptions);
  };

  const recordExit = <A, E>(
    exit: Exit.Exit<A, E>,
    ensureOptions?: WideEventEnsureOptions<A, E>
  ): void => {
    if (Exit.isSuccess(exit)) {
      const successOptions = ensureOptions?.onSuccess?.(exit.value);
      lastResponseStatus = successOptions?.responseStatus;
      applySuccess(logger, successOptions);
    } else {
      recordExitFailure(exit.cause, ensureOptions);
    }
    emitOnce();
  };

  const ensureEmitted = <A, E, R>(
    effect: Effect.Effect<A, E, R>,
    ensureOptions?: WideEventEnsureOptions<A, E>
  ): Effect.Effect<A, E, R> =>
    Effect.onExit(effect, (exit) => safe(() => recordExit(exit, ensureOptions)));

  return {
    set: (fields) =>
      safe(() => {
        logger.set(normalizeFields(fields));
      }),
    succeed: (successOptions) =>
      safe(() => {
        applySuccess(logger, successOptions);
      }),
    fail: (error, failureOptions) =>
      safe(() => {
        applyFailure(logger, error, failureOptions);
      }),
    emit: safe(emitOnce),
    ensureEmitted,
  };
};

export const WideEventLive = (options: WideEventRequestOptions) =>
  Layer.sync(WideEvent, () => makeWideEvent(options));
