import { Effect, Layer } from "effect";
import { EMPTY_MEMORY_CONTEXT } from "../../whisper-memory/domain/memory-context";
import { MemoryProvider } from "../../whisper-memory/application/ports/memory-provider";
import { DictionaryRepository } from "../../dictionary/application/ports/dictionary-repository";
import { expandSnippets } from "../../dictionary/domain/expand-snippets";
import {
  SkillRepository,
  type SkillRepositoryService,
} from "../../skills/application/ports/skill-repository";
import { resolveAppOverlayKey } from "../domain/app-overlay";
import type { SessionContext } from "../domain/session-context";
import { ImprovementFlowSelector } from "./ports/improvement-flow";
import { AppCategoryRepository } from "./ports/app-category-repository";
import { TextGenerator } from "./ports/text-generator";
import { TextImprover, TextImproverError } from "./ports/text-improver";
import { buildSystemPrompt, buildUserMessage } from "./prompt-assembly";
import { sanitizeModelOutput } from "./output-guardrail";

const AGENT_IDENTITY_KEY = "harness/agent-identity.md";
const DEFAULT_CLEANUP_KEY = "harness/default-cleanup.md";
const EXECUTION_POLICY_KEY = "harness/execution-policy.md";
const INTENT_POLICY_KEY = "harness/intent-policy.md";
const LEXICON_POLICY_KEY = "harness/lexicon-policy.md";

// Harness docs are the agent's non-negotiable core. They are bundled at build time,
// so a load failure or empty body means the harness is broken — fail closed rather
// than silently running the model with an incomplete identity or policy stack.
const loadRequiredHarnessDoc = (skillLoader: SkillRepositoryService, key: string) =>
  skillLoader.load(key).pipe(
    Effect.mapError(
      (e) => new TextImproverError({ message: `harness doc "${key}": ${e.message}` })
    ),
    Effect.flatMap((md) =>
      md && md.trim().length > 0
        ? Effect.succeed(md)
        : Effect.fail(new TextImproverError({ message: `harness doc "${key}" missing or empty` }))
    )
  );

export const TextImproverServiceLive = Layer.effect(
  TextImprover,
  Effect.gen(function* () {
    const appCategories = yield* AppCategoryRepository;
    const skillLoader = yield* SkillRepository;
    const flowSelector = yield* ImprovementFlowSelector;
    const memoryProvider = yield* MemoryProvider;
    const dictionaryRepository = yield* DictionaryRepository;
    const generator = yield* TextGenerator;

    return {
      improve: Effect.fnUntraced(function* (params) {
        const category = params.bundleId
          ? yield* appCategories.resolve({ bundleId: params.bundleId, host: params.appHost }).pipe(
              Effect.map((entry) => entry?.category ?? null),
              Effect.catch(() => Effect.succeed(null))
            )
          : null;

        const appOverlayKey = resolveAppOverlayKey(category, params.surfaceContext);
        const [appOverlay, identity, defaultCleanup, executionPolicy, intentPolicy, lexiconPolicy] =
          yield* Effect.all([
            appOverlayKey
              ? skillLoader.load(appOverlayKey).pipe(
                  Effect.map((md) => md ?? ""),
                  Effect.mapError((e) => new TextImproverError({ message: e.message }))
                )
              : Effect.succeed(""),
            loadRequiredHarnessDoc(skillLoader, AGENT_IDENTITY_KEY),
            loadRequiredHarnessDoc(skillLoader, DEFAULT_CLEANUP_KEY),
            loadRequiredHarnessDoc(skillLoader, EXECUTION_POLICY_KEY),
            loadRequiredHarnessDoc(skillLoader, INTENT_POLICY_KEY),
            loadRequiredHarnessDoc(skillLoader, LEXICON_POLICY_KEY),
          ]);

        const contribution = yield* flowSelector.forParams(params).contribute({ category });

        const sessionContext: SessionContext = {
          surface: params.surface,
          appCategory: category,
          bundleId: params.bundleId,
          appHost: params.appHost,
          surfaceContext: params.surfaceContext,
          spokenLanguage: params.detectedLanguage,
          timezone: params.timezone,
        };

        const system = buildSystemPrompt({
          identity,
          defaultCleanup,
          executionPolicy,
          intentPolicy,
          lexiconPolicy,
          sessionContext,
          appOverlay,
          directive: contribution.directive,
        });

        const [memory, dictionary] = yield* Effect.all([
          memoryProvider
            .snapshot({ userId: params.userId, category: "generic" })
            .pipe(Effect.catch(() => Effect.succeed(EMPTY_MEMORY_CONTEXT))),
          dictionaryRepository
            .getDictionary(params.userId)
            .pipe(Effect.catch(() => Effect.succeed({ words: [], snippets: [] }))),
        ]);

        const prompt = buildUserMessage(
          contribution.userHeader,
          params.rawText,
          memory,
          dictionary.snippets
        );

        const text = yield* generator.generate({
          userId: params.userId,
          system,
          prompt,
          routing: contribution.routing,
        });

        // The prompt asks the model to apply snippets, but that is best-effort:
        // small models skip or mangle them. Expanding after the guardrail makes
        // triggers deterministic, including on the raw-text fallback path.
        return expandSnippets(sanitizeModelOutput(params.rawText, text), dictionary.snippets);
      }),
    };
  })
);
