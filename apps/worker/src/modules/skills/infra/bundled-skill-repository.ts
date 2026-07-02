import { Effect, Layer } from "effect";
import type { OfficialSkillDefinition } from "../domain/types";
import { SkillLoaderError } from "../domain/types";
import type { SkillRepositoryService } from "../application/ports/skill-repository";
import { SkillRepository } from "../application/ports/skill-repository";
import { toOfficialSkillDefinition } from "./skill-parser";

import cleanupRaw from "../../../skills/official/cleanup/SKILL.md";
import emailRaw from "../../../skills/official/email/SKILL.md";
import toEnglishRaw from "../../../skills/official/to-english/SKILL.md";
import cavemanRaw from "../../../skills/official/caveman/SKILL.md";

import agentIdentity from "../../../harness/agent-identity.md";
import defaultCleanup from "../../../harness/default-cleanup.md";
import executionPolicy from "../../../harness/execution-policy.md";
import intentPolicy from "../../../harness/intent-policy.md";
import lexiconPolicy from "../../../harness/lexicon-policy.md";
import appOverlayEmail from "../../../harness/app-overlays/email.md";
import appOverlayChat from "../../../harness/app-overlays/chat.md";
import appOverlayCodeEditor from "../../../harness/app-overlays/code-editor.md";
import appOverlayNotes from "../../../harness/app-overlays/notes.md";
import appOverlaySearch from "../../../harness/app-overlays/search.md";
import operationBulletList from "../../../harness/operations/bullet-list.md";
import operationNumberedList from "../../../harness/operations/numbered-list.md";
import operationComposeEmail from "../../../harness/operations/compose-email.md";
import operationComposeMessage from "../../../harness/operations/compose-message.md";
import operationSales from "../../../harness/operations/sales.md";
import operationNote from "../../../harness/operations/note.md";

const OFFICIAL_SKILLS: readonly OfficialSkillDefinition[] = [
  toOfficialSkillDefinition(cleanupRaw, "cleanup"),
  toOfficialSkillDefinition(emailRaw, "email"),
  toOfficialSkillDefinition(toEnglishRaw, "to-english"),
  toOfficialSkillDefinition(cavemanRaw, "caveman"),
];

const skillById = new Map<string, OfficialSkillDefinition>(OFFICIAL_SKILLS.map((s) => [s.id, s]));

const SYSTEM_SKILL_CONTENT: Readonly<Record<string, string>> = {
  "harness/agent-identity.md": agentIdentity,
  "harness/default-cleanup.md": defaultCleanup,
  "harness/execution-policy.md": executionPolicy,
  "harness/intent-policy.md": intentPolicy,
  "harness/lexicon-policy.md": lexiconPolicy,
  "app-overlays/email.md": appOverlayEmail,
  "app-overlays/chat.md": appOverlayChat,
  "app-overlays/code-editor.md": appOverlayCodeEditor,
  "app-overlays/notes.md": appOverlayNotes,
  "app-overlays/search.md": appOverlaySearch,
  "operations/bullet-list.md": operationBulletList,
  "operations/numbered-list.md": operationNumberedList,
  "operations/compose-email.md": operationComposeEmail,
  "operations/compose-message.md": operationComposeMessage,
  "operations/sales.md": operationSales,
  "operations/note.md": operationNote,
};

function resolveSystemSkill(key: string): string | undefined {
  return SYSTEM_SKILL_CONTENT[key];
}

function loadOne(key: string): Effect.Effect<string | null, SkillLoaderError> {
  const system = resolveSystemSkill(key);
  if (system !== undefined) return Effect.succeed(system);

  const official = skillById.get(key);
  if (official) return Effect.succeed(official.markdown);

  return Effect.succeed(null);
}

const repository: SkillRepositoryService = {
  load: loadOne,

  compose: (keys) =>
    Effect.gen(function* () {
      if (keys.length === 0) return "";
      const bodies = yield* Effect.all(keys.map(loadOne), { concurrency: "unbounded" });
      return bodies
        .filter((body): body is string => !!body)
        .map((body) => body.trim())
        .join("\n\n");
    }),

  getById: (id) => skillById.get(id) ?? null,

  list: () => OFFICIAL_SKILLS,

  listDemo: () => OFFICIAL_SKILLS.filter((s) => s.demo),
};

export const SkillsLive = () => Layer.succeed(SkillRepository, repository);
