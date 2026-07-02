const TOKEN_KEY = "sw_auth_token";

export const getToken = (): Promise<string | null> =>
  chrome.storage.local.get(TOKEN_KEY).then((result) => result[TOKEN_KEY] ?? null);

export const setToken = (token: string): Promise<void> =>
  chrome.storage.local.set({ [TOKEN_KEY]: token });

export const removeToken = (): Promise<void> => chrome.storage.local.remove(TOKEN_KEY);
