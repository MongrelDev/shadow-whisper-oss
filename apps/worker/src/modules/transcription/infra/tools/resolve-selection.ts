import { Effect } from "effect";
import type { InstalledSkillSummary } from "../../../skills-catalog/domain/installed-skill";
import type { SkillRepositoryService } from "../../../skills/application/ports/skill-repository";
import type { TranscriptOperation } from "../../domain/operations";

export interface SelectionCatalog {
  readonly operations: readonly TranscriptOperation[];
  readonly installed: readonly InstalledSkillSummary[];
  readonly skillLoader: SkillRepositoryService;
}

export interface ResolvedSelection {
  readonly skillMarkdown: string | null;
  readonly skillName: string | null;
}

const STRIP_INVOCATION_PREAMBLE = [
  "FIRST, delete the invocation from the transcript: the phrase the speaker used",
  "to request this skill or operation — its name, trigger words, a translation or",
  'paraphrase of them, or framing like "use my X skill" / "usa a habilidade X" /',
  '"make this a list" — wherever it appears (usually the start or the end). The',
  "invocation is a command to you, not content: it must not appear in the output",
  "in any language, neither verbatim nor translated. THEN apply the instructions",
  "below to everything else the speaker said.",
  "",
  "---",
  "",
].join("\n");

const withStripInvocation = (skillMarkdown: string | null): string | null =>
  skillMarkdown === null ? null : STRIP_INVOCATION_PREAMBLE + skillMarkdown;

const loadByKey = (skillLoader: SkillRepositoryService, key: string) =>
  skillLoader.load(key).pipe(Effect.catch(() => Effect.succeed(null)));

export const resolveSelection = (
  id: string,
  catalog: SelectionCatalog
): Effect.Effect<ResolvedSelection, never> =>
  Effect.gen(function* () {
    const operation = catalog.operations.find((op) => op.id === id);
    if (operation) {
      const skillMarkdown = yield* loadByKey(catalog.skillLoader, operation.skillKey);
      return { skillMarkdown: withStripInvocation(skillMarkdown), skillName: operation.label };
    }

    const installed = catalog.installed.find((s) => s.skillId === id);
    if (!installed) return { skillMarkdown: null, skillName: null };

    const skillMarkdown =
      installed.markdown ?? (yield* loadByKey(catalog.skillLoader, installed.skillId));

    return {
      skillMarkdown: withStripInvocation(skillMarkdown),
      skillName: installed.displayName,
    };
  });
