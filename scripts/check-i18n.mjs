#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const ERRORS_FILE = resolve(ROOT, "packages/api/src/errors.ts");
const LOCALE_FILES = [
  ["apps/web/messages/en.json", "web", "en"],
  ["apps/web/messages/pt-BR.json", "web", "pt-BR"],
  ["apps/desktop/messages/en.json", "desktop", "en"],
  ["apps/desktop/messages/pt-BR.json", "desktop", "pt-BR"],
];

function parseErrorCodes(path) {
  const src = readFileSync(path, "utf8");
  const match = src.match(/export type ErrorCode =([\s\S]*?);/);
  if (!match) throw new Error(`ErrorCode union not found in ${path}`);
  const codes = [...match[1].matchAll(/"(er_[a-z0-9_]+)"/g)].map((m) => m[1]);
  if (codes.length === 0) throw new Error(`No er_* codes parsed from ${path}`);
  return codes;
}

function loadKeys(path) {
  const json = JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));
  return Object.keys(json).filter((k) => !k.startsWith("$"));
}

const errors = [];
const codes = parseErrorCodes(ERRORS_FILE);

const keysByFile = new Map();
for (const [path] of LOCALE_FILES) keysByFile.set(path, loadKeys(path));

for (const [path] of LOCALE_FILES) {
  const keys = new Set(keysByFile.get(path));
  const missing = codes.filter((c) => !keys.has(c));
  if (missing.length > 0) {
    errors.push(`${path}: missing ErrorCode keys → ${missing.join(", ")}`);
  }
}

const apps = new Map();
for (const [path, app, locale] of LOCALE_FILES) {
  if (!apps.has(app)) apps.set(app, {});
  apps.get(app)[locale] = { path, keys: keysByFile.get(path) };
}

for (const [app, locales] of apps) {
  const en = new Set(locales.en.keys);
  const pt = new Set(locales["pt-BR"].keys);
  const onlyEn = locales.en.keys.filter((k) => !pt.has(k));
  const onlyPt = locales["pt-BR"].keys.filter((k) => !en.has(k));
  if (onlyEn.length > 0) {
    errors.push(`${app}: keys in en but not pt-BR → ${onlyEn.join(", ")}`);
  }
  if (onlyPt.length > 0) {
    errors.push(`${app}: keys in pt-BR but not en → ${onlyPt.join(", ")}`);
  }
}

if (errors.length > 0) {
  console.error("i18n check failed:");
  for (const e of errors) console.error(`  • ${e}`);
  process.exit(1);
}

const totalKeys = [...keysByFile.values()].reduce((sum, k) => sum + k.length, 0);
console.log(
  `i18n check passed — ${codes.length} ErrorCodes, ${totalKeys} total keys across 4 locale files, en↔pt-BR in parity.`
);
