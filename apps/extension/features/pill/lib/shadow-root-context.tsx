import { createContext, useContext, type ReactNode } from "react";

const ShadowRootContext = createContext<ShadowRoot | null>(null);

type ShadowRootProviderProps = {
  shadowRoot: ShadowRoot;
  children: ReactNode;
};

export function ShadowRootProvider({ shadowRoot, children }: ShadowRootProviderProps) {
  return <ShadowRootContext.Provider value={shadowRoot}>{children}</ShadowRootContext.Provider>;
}

export function useShadowRoot(): ShadowRoot | null {
  return useContext(ShadowRootContext);
}
