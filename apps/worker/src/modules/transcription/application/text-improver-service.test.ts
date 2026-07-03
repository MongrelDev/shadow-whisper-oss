import { describe, expect, it } from "@effect/vitest";
import { Effect, Exit, Layer } from "effect";
import { TextImproverServiceLive } from "./text-improver-service";
import { ImprovementFlowSelectorLive } from "./improvement-flow-selector";
import { TextImprover, TextImproverError, type TextImproverParams } from "./ports/text-improver";
import {
  TextGenerator,
  type GenerateTextRequest,
  type TextGeneratorService,
} from "./ports/text-generator";
import {
  AppCategoryRepository,
  type AppCategoryRepositoryService,
} from "./ports/app-category-repository";
import type { AppCategory, AppRegistryEntry } from "../domain/app-category";
import {
  SkillRepository,
  type SkillRepositoryService,
} from "../../skills/application/ports/skill-repository";
import {
  SkillInstallationRepository,
  type SkillInstallationRepositoryService,
} from "../../skills-catalog/application/ports/skill-installation-repository";
import type { InstalledSkillSummary } from "../../skills-catalog/domain/installed-skill";
import {
  MemoryProvider,
  type MemoryProviderService,
} from "../../whisper-memory/application/ports/memory-provider";
import { EMPTY_MEMORY_CONTEXT } from "../../whisper-memory/domain/memory-context";
import {
  DictionaryRepository,
  type DictionaryRepositoryService,
} from "../../dictionary/application/ports/dictionary-repository";

const USER_ID = "user-1";

const installedSkill: InstalledSkillSummary = {
  skillId: "skill-sales",
  displayName: "Sales Pitch",
  description: "Rewrites text as a persuasive sales pitch",
  slug: "sales",
  installedAt: 0,
  markdown: "Make it sell.",
};

const makeAppCategoryRepo = (category: AppCategory | null): AppCategoryRepositoryService => ({
  resolve: () =>
    Effect.succeed(category ? ({ hostName: "Test App", category } as AppRegistryEntry) : null),
});

const AGENT_IDENTITY = "AGENT_IDENTITY_DOC";
const DEFAULT_CLEANUP = "DEFAULT_CLEANUP_DOC";
const EXECUTION_POLICY = "EXECUTION_POLICY_DOC";
const INTENT_POLICY = "INTENT_POLICY_DOC";
const LEXICON_POLICY = "LEXICON_POLICY_DOC";
const EMAIL_OVERLAY = "EMAIL_OVERLAY_DOC";
const SEARCH_OVERLAY = "SEARCH_OVERLAY_DOC";

const HARNESS_DOCS: Record<string, string> = {
  "harness/agent-identity.md": AGENT_IDENTITY,
  "harness/default-cleanup.md": DEFAULT_CLEANUP,
  "harness/execution-policy.md": EXECUTION_POLICY,
  "harness/intent-policy.md": INTENT_POLICY,
  "harness/lexicon-policy.md": LEXICON_POLICY,
  "app-overlays/email.md": EMAIL_OVERLAY,
  "app-overlays/search.md": SEARCH_OVERLAY,
};

const makeSkillRepo = (): SkillRepositoryService => ({
  load: (key) => Effect.succeed(HARNESS_DOCS[key] ?? null),
  compose: () => Effect.succeed(""),
  getById: () => null,
  list: () => [],
  listDemo: () => [],
});

const makeInstallRepo = (
  installed: InstalledSkillSummary[]
): SkillInstallationRepositoryService => ({
  install: () => Effect.void,
  uninstall: () => Effect.void,
  listInstalled: () => Effect.succeed(installed),
});

const makeMemoryProvider = (): MemoryProviderService => ({
  snapshot: () => Effect.succeed(EMPTY_MEMORY_CONTEXT),
});

const makeDictionaryRepo = (
  snippets: Array<{ triggerPhrase: string; expandedText: string }> = []
): DictionaryRepositoryService => ({
  getDictionary: () =>
    Effect.succeed({
      words: [],
      snippets: snippets.map((s, i) => ({ id: i + 1, createdAt: 0, ...s })),
    }),
  addWord: () => Effect.die("not needed"),
  removeWord: () => Effect.void,
  addSnippet: () => Effect.die("not needed"),
  removeSnippet: () => Effect.void,
});

interface Capture {
  request?: GenerateTextRequest;
}

const makeGenerator = (
  capture: Capture,
  result: Effect.Effect<string, TextImproverError> = Effect.succeed("IMPROVED_TEXT")
): TextGeneratorService => ({
  generate: (req) => {
    capture.request = req;
    return result;
  },
});

function buildLayer(opts: {
  category?: AppCategory | null;
  installed?: InstalledSkillSummary[];
  capture?: Capture;
  generatorResult?: Effect.Effect<string, TextImproverError>;
  snippets?: Array<{ triggerPhrase: string; expandedText: string }>;
}) {
  const flowSelector = ImprovementFlowSelectorLive.pipe(
    Layer.provide([
      Layer.succeed(SkillInstallationRepository, makeInstallRepo(opts.installed ?? [])),
      Layer.succeed(SkillRepository, makeSkillRepo()),
    ])
  );
  return TextImproverServiceLive.pipe(
    Layer.provide([
      Layer.succeed(AppCategoryRepository, makeAppCategoryRepo(opts.category ?? null)),
      Layer.succeed(SkillRepository, makeSkillRepo()),
      flowSelector,
      Layer.succeed(MemoryProvider, makeMemoryProvider()),
      Layer.succeed(DictionaryRepository, makeDictionaryRepo(opts.snippets)),
      Layer.succeed(TextGenerator, makeGenerator(opts.capture ?? {}, opts.generatorResult)),
    ])
  );
}

function runImprove(params: TextImproverParams, layer: Layer.Layer<TextImprover>) {
  return Effect.gen(function* () {
    const svc = yield* TextImprover;
    return yield* svc.improve(params);
  }).pipe(Effect.provide(layer), Effect.exit);
}

const voiceParams = (over: Partial<TextImproverParams> = {}): TextImproverParams =>
  ({
    mode: "voice-skills",
    userId: USER_ID,
    rawText: "raw transcript text",
    surface: null,
    bundleId: null,
    appHost: null,
    surfaceContext: null,
    detectedLanguage: null,
    timezone: null,
    ...over,
  }) as TextImproverParams;

describe("TextImproverService", () => {
  describe("app overlay selection", () => {
    it.effect("adds no app-specific formatting when there is no app context", () =>
      Effect.gen(function* () {
        const capture: Capture = {};
        const layer = buildLayer({ capture });

        yield* runImprove(voiceParams(), layer);

        const system = capture.request?.system ?? "";
        expect(system).not.toContain("## App surface hint");
        expect(system).not.toContain(EMAIL_OVERLAY);
      })
    );

    it.effect("overlays the app-specific formatting for the resolved app category", () =>
      Effect.gen(function* () {
        const capture: Capture = {};
        const layer = buildLayer({ category: "email" as AppCategory, capture });

        yield* runImprove(voiceParams({ bundleId: "com.apple.mail", appHost: null }), layer);

        const system = capture.request?.system ?? "";
        expect(system).toContain("## App surface hint");
        expect(system).toContain(EMAIL_OVERLAY);
      })
    );

    it.effect("prefers the focused-field overlay over the app category overlay", () =>
      Effect.gen(function* () {
        const capture: Capture = {};
        const layer = buildLayer({ category: "email" as AppCategory, capture });

        yield* runImprove(
          voiceParams({ bundleId: "com.google.Chrome", surfaceContext: "search" }),
          layer
        );

        const system = capture.request?.system ?? "";
        expect(system).toContain(SEARCH_OVERLAY);
        expect(system).not.toContain(EMAIL_OVERLAY);
      })
    );
  });

  describe("session context", () => {
    it.effect("reports the STT-detected spoken language, never a UI locale", () =>
      Effect.gen(function* () {
        const capture: Capture = {};
        const layer = buildLayer({ capture });

        yield* runImprove(voiceParams({ detectedLanguage: "pt" }), layer);

        const system = capture.request?.system ?? "";
        expect(system).toContain("Spoken language (detected from the audio): pt");
        expect(system).not.toContain("Formatting language hint");
      })
    );
  });

  describe("voice-skills mode", () => {
    it.effect("passes installed skills to the generator and lists them in the system prompt", () =>
      Effect.gen(function* () {
        const capture: Capture = {};
        const layer = buildLayer({ installed: [installedSkill], capture });

        yield* runImprove(voiceParams(), layer);

        const req = capture.request!;
        expect(req.routing?.installed).toEqual([{ ...installedSkill, triggers: [] }]);
        expect(req.system).toContain("## Voice-activated user skills");
        expect(req.system).toContain(`id: "${installedSkill.skillId}"`);
        expect(req.system).toContain("Sales Pitch");
        expect(req.prompt).toContain("raw transcript text");
      })
    );

    it.effect("lists a skill's voice triggers in the intent router catalog", () =>
      Effect.gen(function* () {
        const capture: Capture = {};
        const withTriggers: InstalledSkillSummary = {
          ...installedSkill,
          triggers: ["sales pitch", "make it sell"],
        };
        const layer = buildLayer({ installed: [withTriggers], capture });

        yield* runImprove(voiceParams(), layer);

        expect(capture.request?.system).toContain('voice triggers: "sales pitch", "make it sell"');
      })
    );

    it.effect(
      "offers the intent router but no voice-skills section when nothing is installed",
      () =>
        Effect.gen(function* () {
          const capture: Capture = {};
          const layer = buildLayer({ installed: [], capture });

          yield* runImprove(voiceParams(), layer);

          const system = capture.request?.system ?? "";
          expect(system).toContain("## Intent router");
          expect(system).toContain(AGENT_IDENTITY);
          expect(system).not.toContain("## Voice-activated user skills");
          expect(capture.request?.routing?.installed).toEqual([]);
        })
    );
  });

  describe("forced-skill mode", () => {
    it.effect("appends the forced skill markdown and does not enable voice tools", () =>
      Effect.gen(function* () {
        const capture: Capture = {};
        const layer = buildLayer({ capture });

        yield* runImprove(
          {
            mode: "forced-skill",
            userId: USER_ID,
            rawText: "raw transcript text",
            surface: null,
            bundleId: null,
            appHost: null,
            surfaceContext: null,
            detectedLanguage: null,
            timezone: null,
            skillMarkdown: "FORCED_SKILL_BODY",
          },
          layer
        );

        expect(capture.request?.system).toContain("## Forced skill (MANDATORY");
        expect(capture.request?.system).toContain("FORCED_SKILL_BODY");
        expect(capture.request?.routing).toBeUndefined();
      })
    );
  });

  describe("result handling", () => {
    it.effect("returns the generated text on success", () =>
      Effect.gen(function* () {
        const exit = yield* runImprove(voiceParams(), buildLayer({}));
        expect(exit).toStrictEqual(Exit.succeed("IMPROVED_TEXT"));
      })
    );

    it.effect("falls back to the raw text when the generator returns empty", () =>
      Effect.gen(function* () {
        const layer = buildLayer({ generatorResult: Effect.succeed("") });
        const exit = yield* runImprove(voiceParams({ rawText: "keep me" }), layer);
        expect(exit).toStrictEqual(Exit.succeed("keep me"));
      })
    );

    it.effect("propagates a generator failure", () =>
      Effect.gen(function* () {
        const layer = buildLayer({
          generatorResult: Effect.fail(new TextImproverError({ message: "boom" })),
        });
        const exit = yield* runImprove(voiceParams(), layer);
        expect(Exit.isFailure(exit)).toBe(true);
      })
    );
  });

  describe("snippet expansion", () => {
    const snippets = [{ triggerPhrase: "addr", expandedText: "Rua das Flores 123" }];

    it.effect("lists snippets in the user message so the model can apply them", () =>
      Effect.gen(function* () {
        const capture: Capture = {};
        const layer = buildLayer({ capture, snippets });

        yield* runImprove(voiceParams(), layer);

        expect(capture.request?.prompt).toContain('"addr" → "Rua das Flores 123"');
      })
    );

    it.effect("expands triggers the model left in its output", () =>
      Effect.gen(function* () {
        const layer = buildLayer({
          snippets,
          generatorResult: Effect.succeed("Send it to addr today."),
        });
        const exit = yield* runImprove(voiceParams(), layer);
        expect(exit).toStrictEqual(Exit.succeed("Send it to Rua das Flores 123 today."));
      })
    );

    it.effect("expands triggers on the raw-text fallback path", () =>
      Effect.gen(function* () {
        const layer = buildLayer({ snippets, generatorResult: Effect.succeed("") });
        const exit = yield* runImprove(voiceParams({ rawText: "my addr please" }), layer);
        expect(exit).toStrictEqual(Exit.succeed("my Rua das Flores 123 please"));
      })
    );

    it.effect("leaves output untouched when the model already expanded the trigger", () =>
      Effect.gen(function* () {
        const layer = buildLayer({
          snippets,
          generatorResult: Effect.succeed("Send it to Rua das Flores 123 today."),
        });
        const exit = yield* runImprove(voiceParams(), layer);
        expect(exit).toStrictEqual(Exit.succeed("Send it to Rua das Flores 123 today."));
      })
    );
  });

  describe("harness safety", () => {
    it.effect("injects the agent identity and execution policy into the system prompt", () =>
      Effect.gen(function* () {
        const capture: Capture = {};
        const layer = buildLayer({ capture });

        yield* runImprove(voiceParams(), layer);

        const system = capture.request?.system ?? "";
        expect(system).toContain(AGENT_IDENTITY);
        expect(system).toContain("<lexicon_policy>");
        expect(system).toContain(LEXICON_POLICY);
        expect(system).toContain("<default_cleanup>");
        expect(system).toContain(DEFAULT_CLEANUP);
        expect(system).toContain("<intent_policy>");
        expect(system).toContain(INTENT_POLICY);
        expect(system).toContain("<execution_policy>");
        expect(system).toContain(EXECUTION_POLICY);
      })
    );

    it.effect("fails closed when a required harness doc is missing", () =>
      Effect.gen(function* () {
        const brokenSkillRepo: SkillRepositoryService = {
          load: (key) =>
            Effect.succeed(key === "harness/agent-identity.md" ? AGENT_IDENTITY : null),
          compose: () => Effect.succeed(""),
          getById: () => null,
          list: () => [],
          listDemo: () => [],
        };
        const flowSelector = ImprovementFlowSelectorLive.pipe(
          Layer.provide([
            Layer.succeed(SkillInstallationRepository, makeInstallRepo([])),
            Layer.succeed(SkillRepository, brokenSkillRepo),
          ])
        );
        const layer = TextImproverServiceLive.pipe(
          Layer.provide([
            Layer.succeed(AppCategoryRepository, makeAppCategoryRepo(null)),
            Layer.succeed(SkillRepository, brokenSkillRepo),
            flowSelector,
            Layer.succeed(MemoryProvider, makeMemoryProvider()),
            Layer.succeed(DictionaryRepository, makeDictionaryRepo()),
            Layer.succeed(TextGenerator, makeGenerator({})),
          ])
        );

        const exit = yield* runImprove(voiceParams(), layer);
        expect(Exit.isFailure(exit)).toBe(true);
      })
    );
  });
});
