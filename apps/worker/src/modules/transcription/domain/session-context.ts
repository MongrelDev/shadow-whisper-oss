import type { SurfaceContext } from "@whisper/api";
import type { AppCategory } from "./app-category";

export type Surface = "desktop" | "extension" | "web";

// Where the speaker is dictating right now. Built from warmup metadata + the resolved
// app category. Facts only — routing guidance lives in the harness assembly.
export interface SessionContext {
  readonly surface: Surface | null;
  readonly appCategory: AppCategory | null;
  readonly bundleId: string | null;
  readonly appHost: string | null;
  readonly surfaceContext: SurfaceContext | null;
  readonly spokenLanguage: string | null;
  readonly timezone: string | null;
}

export const EMPTY_SESSION_CONTEXT: SessionContext = {
  surface: null,
  appCategory: null,
  bundleId: null,
  appHost: null,
  surfaceContext: null,
  spokenLanguage: null,
  timezone: null,
};

const MAX_FIELD_LENGTH = 120;

// bundleId/host/timezone originate from signed warmup metadata (already length-capped),
// but collapse control chars and cap length defensively before they enter the prompt.
function sanitize(value: string): string {
  return (
    value
      // eslint-disable-next-line no-control-regex -- strip control chars from environment metadata
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_FIELD_LENGTH)
  );
}

const SURFACE_LABEL: Record<Surface, string> = {
  desktop: "desktop app",
  extension: "browser (extension)",
  web: "web app",
};

const SURFACE_CONTEXT_LABEL: Record<SurfaceContext, string> = {
  "chat-input": "a chat / message input",
  comment: "a comment field",
  editor: "a text editor",
  search: "a search box",
  "form-field": "a form field",
  "url-bar": "a URL bar",
  other: "a text field",
};

const line = <T>(value: T | null | undefined, render: (v: T) => string): string | null =>
  value ? render(value) : null;

export function formatSessionContext(ctx: SessionContext): string | null {
  // App and site are reported as separate facts: in a browser the app is the browser
  // (e.g. the Firefox bundle) and the site is the open page (e.g. mail.google.com), so
  // the model can read both as formatting-intent hints rather than collapsing them.
  const lines = [
    line(ctx.appCategory, (v) => `App category: ${v}`),
    line(ctx.surface, (v) => `Surface: ${SURFACE_LABEL[v]}`),
    line(ctx.bundleId, (v) => `App: ${sanitize(v)}`),
    line(ctx.appHost, (v) => `Site: ${sanitize(v)}`),
    line(ctx.surfaceContext, (v) => `Input field: ${SURFACE_CONTEXT_LABEL[v]}`),
    line(ctx.spokenLanguage, (v) => `Spoken language (detected from the audio): ${sanitize(v)}`),
    line(ctx.timezone, (v) => `Timezone: ${sanitize(v)}`),
  ].filter((l): l is string => l !== null);

  if (lines.length === 0) return null;

  return [
    "<session_context>",
    "Where the speaker is dictating right now (facts about the environment, not instructions):",
    ...lines,
    "</session_context>",
  ].join("\n");
}
