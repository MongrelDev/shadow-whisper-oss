import type { SurfaceContext } from "@whisper/api";
import type { AppCategory } from "./app-category";

// The core cleanup behaviour lives in the agent's identity (always loaded). On top of
// that, where the speaker is dictating can call for app-specific formatting: a code
// editor implies identifier/symbol conventions, an email implies a sendable shape, a
// chat box implies short-message rhythm. The resolved app category selects at most one
// overlay; categories without a dedicated overlay run on the identity alone.
const APP_OVERLAY_BY_CATEGORY: Partial<Record<AppCategory, string>> = {
  "code-editor": "app-overlays/code-editor.md",
  terminal: "app-overlays/code-editor.md",
  email: "app-overlays/email.md",
  messaging: "app-overlays/chat.md",
  social: "app-overlays/chat.md",
  notes: "app-overlays/notes.md",
};

// The focused input field is a finer-grained signal than the app category: a search
// box inside any app wants a bare query, a chat input wants message rhythm. The field
// wins over the category when both map to an overlay (a search box in a browser is
// still a search box); the category covers fields the probe could not classify.
const APP_OVERLAY_BY_SURFACE_CONTEXT: Partial<Record<SurfaceContext, string>> = {
  search: "app-overlays/search.md",
  "url-bar": "app-overlays/search.md",
  "chat-input": "app-overlays/chat.md",
};

export const appOverlayKeyForCategory = (category: AppCategory | null): string | null =>
  category ? (APP_OVERLAY_BY_CATEGORY[category] ?? null) : null;

export const resolveAppOverlayKey = (
  category: AppCategory | null,
  surfaceContext: SurfaceContext | null
): string | null => {
  const fromField = surfaceContext
    ? (APP_OVERLAY_BY_SURFACE_CONTEXT[surfaceContext] ?? null)
    : null;
  return fromField ?? appOverlayKeyForCategory(category);
};
