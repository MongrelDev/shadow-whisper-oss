import type {
  ElectronAPI,
  ApiResult,
  DictionaryWord as SharedDictionaryWord,
  Snippet as SharedSnippet,
  Dictionary as SharedDictionary,
  Skill as SharedSkill,
  AppConfigData as SharedAppConfigData,
  AppConfigPatch as SharedAppConfigPatch,
  ShortcutConfigData as SharedShortcutConfigData,
} from "../../shared/ipc-types";

declare global {
  interface Window {
    api: ElectronAPI;
    // Better Auth Electron bridges exposed by `setupRenderer()` in preload.
    // Typed loosely here because the plugin's type export is not available
    // in the renderer's tsconfig graph.
    requestAuth: (options?: { provider?: string; callbackURL?: string }) => Promise<void>;
    signOut: () => Promise<void>;
    authenticate: (input: { token: string }) => Promise<unknown>;
    getUser: () => Promise<{ id: string; email: string; name: string } | null>;
    onAuthenticated: (callback: (user: unknown) => void) => () => void;
    onUserUpdated: (callback: (user: unknown) => void) => () => void;
    onAuthError: (callback: (ctx: { message: string; path?: unknown }) => void) => () => void;
  }

  // Re-export shared types globally for backward compat with renderer code
  type DictionaryWord = SharedDictionaryWord;
  type Snippet = SharedSnippet;
  type Dictionary = SharedDictionary;
  type Skill = SharedSkill;

  // Legacy aliases — all map to ApiResult<T>
  type DictionaryResult<T = void> = ApiResult<T>;

  type AppConfigData = SharedAppConfigData;
  type AppConfigPatch = SharedAppConfigPatch;

  type ConfigGetResult = ApiResult<AppConfigData>;
  type ConfigSetResult = ApiResult;

  type ShortcutConfigData = SharedShortcutConfigData;

  type ShortcutsGetResult = ApiResult<ShortcutConfigData>;
  type ShortcutsSetResult = ApiResult;
}

export type { ElectronAPI };
