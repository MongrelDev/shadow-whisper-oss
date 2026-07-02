export interface AppContext {
  readonly bundleId: string | null;
  readonly host: string | null;
}

export const EMPTY_APP_CONTEXT: AppContext = { bundleId: null, host: null };
