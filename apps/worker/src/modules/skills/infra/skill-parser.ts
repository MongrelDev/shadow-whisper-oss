import type { OfficialSkillDefinition } from "../domain/types";
import { SkillParseError } from "../domain/types";

interface ParsedSkillMarkdown {
  readonly manifest: Record<string, unknown>;
  readonly body: string;
}

// eslint-disable-next-line no-irregular-whitespace -- BOM removal requires matching the literal character
const BOM_REGEX = /^﻿/;
const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const BLANK_OR_COMMENT = /^\s*(#.*)?$/;
const KEY_VALUE = /^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/;
const ARRAY_ITEM = /^\s+-\s+(.+)$/;

export function parseSkillMarkdown(raw: string): ParsedSkillMarkdown {
  const text = raw.replace(BOM_REGEX, "");
  const match = FRONTMATTER_REGEX.exec(text);
  if (!match) return { manifest: {}, body: text };
  const yaml = match[1] ?? "";
  const body = match[2] ?? "";
  return { manifest: parseYamlSubset(yaml), body };
}

function collectArrayItems(
  lines: readonly string[],
  startIdx: number
): { items: string[]; consumed: number } {
  const items: string[] = [];
  let offset = 0;
  while (startIdx + offset + 1 < lines.length) {
    const next = lines[startIdx + offset + 1]!;
    const itemMatch = ARRAY_ITEM.exec(next);
    if (!itemMatch) break;
    items.push(itemMatch[1]!.trim());
    offset++;
  }
  return { items, consumed: offset };
}

function parseYamlSubset(src: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = src.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    if (BLANK_OR_COMMENT.test(line)) {
      i++;
      continue;
    }

    const keyMatch = KEY_VALUE.exec(line);
    if (!keyMatch) {
      i++;
      continue;
    }

    const key = keyMatch[1]!;
    const valueRaw = keyMatch[2]!.trim();

    if (valueRaw === "") {
      const { items, consumed } = collectArrayItems(lines, i);
      result[key] = items.length > 0 ? items : "";
      i += consumed + 1;
      continue;
    }

    result[key] = coerceScalar(valueRaw);
    i++;
  }

  return result;
}

function isQuoted(raw: string): boolean {
  return (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"));
}

function coerceScalar(raw: string): string | boolean {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (isQuoted(raw)) return raw.slice(1, -1);
  return raw;
}

function getString(m: Record<string, unknown>, key: string): string | undefined {
  const v = m[key];
  return typeof v === "string" ? v : undefined;
}

function getBoolean(m: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const v = m[key];
  return typeof v === "boolean" ? v : fallback;
}

function getStringArray(m: Record<string, unknown>, key: string): readonly string[] {
  const v = m[key];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}

function assertRequiredField(
  id: string,
  field: string,
  value: string | undefined
): asserts value is string {
  if (!value) {
    throw new SkillParseError({
      message: `SKILL.md "${id}" missing required field: ${field}`,
      internal: { skillId: id, field },
    });
  }
}

export function toOfficialSkillDefinition(
  raw: string,
  fallbackId: string
): OfficialSkillDefinition {
  const { manifest, body } = parseSkillMarkdown(raw);

  const id = getString(manifest, "id") ?? fallbackId;
  const displayName = getString(manifest, "displayName");
  const description = getString(manifest, "description");

  assertRequiredField(id, "displayName", displayName);
  assertRequiredField(id, "description", description);

  const trimmedBody = body.trim();
  if (trimmedBody === "") {
    throw new SkillParseError({
      message: `SKILL.md "${id}" has an empty body`,
      internal: { skillId: id },
    });
  }

  const slug = getString(manifest, "slug") ?? id;
  const surface = (getString(manifest, "surface") ?? "transformer") as "transformer";
  const demo = getBoolean(manifest, "demo", false);
  const triggers = getStringArray(manifest, "triggers");

  return {
    id,
    slug,
    displayName,
    description,
    triggers,
    surface,
    demo,
    markdown: trimmedBody,
  };
}
