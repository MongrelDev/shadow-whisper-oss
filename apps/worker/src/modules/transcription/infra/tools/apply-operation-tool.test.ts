import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { makeApplyOperationTool } from "./apply-operation-tool";
import type { ResolvedSelection } from "./resolve-selection";
import type { TranscriptOperation } from "../../domain/operations";
import type { SkillRepositoryService } from "../../../skills/application/ports/skill-repository";
import type { InstalledSkillSummary } from "../../../skills-catalog/domain/installed-skill";

const TOOL_OPTIONS = { toolCallId: "call-1", messages: [] } as never;

const makeSkillLoader = (
  loadSpy: (key: string) => void,
  loaded: string | null = "LOADED_MARKDOWN"
): SkillRepositoryService => ({
  load: (key) => {
    loadSpy(key);
    return Effect.succeed(loaded);
  },
  compose: () => Effect.succeed(""),
  getById: () => null,
  list: () => [],
  listDemo: () => [],
});

const operation: TranscriptOperation = {
  id: "bullet-list",
  label: "Bullet list",
  when: "the speaker is enumerating discrete items",
  skillKey: "operations/bullet-list.md",
};

const skill = (over: Partial<InstalledSkillSummary> = {}): InstalledSkillSummary => ({
  skillId: "skill-sales",
  displayName: "Sales Pitch",
  description: "Rewrites text as a persuasive sales pitch",
  slug: "sales",
  installedAt: 0,
  ...over,
});

describe("makeApplyOperationTool", () => {
  it("resolves a system operation by loading its skill key", async () => {
    const loadSpy = vi.fn<(key: string) => void>();
    const tool = makeApplyOperationTool({
      operations: [operation],
      installedSkills: [],
      skillLoader: makeSkillLoader(loadSpy, "BULLET_BODY"),
    });

    const result = (await tool.execute!({ id: "bullet-list" }, TOOL_OPTIONS)) as ResolvedSelection;

    expect(result.skillName).toBe("Bullet list");
    expect(result.skillMarkdown).toContain("BULLET_BODY");
    expect(result.skillMarkdown).toContain("delete the invocation");
    expect(loadSpy).toHaveBeenCalledWith("operations/bullet-list.md");
  });

  it("returns inline skill markdown without loading from the repository", async () => {
    const loadSpy = vi.fn<(key: string) => void>();
    const tool = makeApplyOperationTool({
      operations: [operation],
      installedSkills: [skill({ markdown: "INLINE_BODY" })],
      skillLoader: makeSkillLoader(loadSpy),
    });

    const result = (await tool.execute!({ id: "skill-sales" }, TOOL_OPTIONS)) as ResolvedSelection;

    expect(result.skillName).toBe("Sales Pitch");
    expect(result.skillMarkdown).toContain("INLINE_BODY");
    expect(result.skillMarkdown).toContain("delete the invocation");
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it("falls back to skillLoader.load for an installed skill without inline markdown", async () => {
    const loadSpy = vi.fn<(key: string) => void>();
    const tool = makeApplyOperationTool({
      operations: [operation],
      installedSkills: [skill({ markdown: undefined })],
      skillLoader: makeSkillLoader(loadSpy, "FROM_LOADER"),
    });

    const result = (await tool.execute!({ id: "skill-sales" }, TOOL_OPTIONS)) as ResolvedSelection;

    expect(result.skillName).toBe("Sales Pitch");
    expect(result.skillMarkdown).toContain("FROM_LOADER");
    expect(loadSpy).toHaveBeenCalledWith("skill-sales");
  });

  it("returns nulls when the id matches neither an operation nor an installed skill", async () => {
    const loadSpy = vi.fn<(key: string) => void>();
    const tool = makeApplyOperationTool({
      operations: [operation],
      installedSkills: [skill()],
      skillLoader: makeSkillLoader(loadSpy),
    });

    const result = await tool.execute!({ id: "unknown" }, TOOL_OPTIONS);

    expect(result).toEqual({ skillMarkdown: null, skillName: null });
    expect(loadSpy).not.toHaveBeenCalled();
  });
});
