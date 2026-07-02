import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { InteractionMode } from "../../shared/ipc-types";

interface InteractionModeContextValue {
  mode: InteractionMode;
  setMode: (mode: InteractionMode, owner?: string) => Promise<void>;
  clearMode: (owner?: string) => Promise<void>;
}

const InteractionModeContext = createContext<InteractionModeContextValue | null>(null);

export function InteractionModeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [mode, setModeState] = useState<InteractionMode>("idle");

  useEffect(() => {
    void window.api.interaction.getMode().then((result) => {
      if (result.success && result.data) {
        setModeState(result.data);
      }
    });
  }, []);

  const setMode = useCallback(async (nextMode: InteractionMode, owner?: string) => {
    setModeState(nextMode);
    const result = await window.api.interaction.setMode(nextMode, owner);
    if (!result.success) {
      setModeState("idle");
    }
  }, []);

  const clearMode = useCallback(async (owner?: string) => {
    setModeState("idle");
    const result = await window.api.interaction.clearMode(owner);
    if (!result.success) {
      const current = await window.api.interaction.getMode();
      if (current.success && current.data) {
        setModeState(current.data);
      }
    }
  }, []);

  const value = useMemo<InteractionModeContextValue>(
    () => ({
      mode,
      setMode,
      clearMode,
    }),
    [clearMode, mode, setMode]
  );

  return (
    <InteractionModeContext.Provider value={value}>{children}</InteractionModeContext.Provider>
  );
}

export function useInteractionMode(): InteractionModeContextValue {
  const context = useContext(InteractionModeContext);

  if (!context) {
    throw new Error("useInteractionMode must be used within InteractionModeProvider");
  }

  return context;
}
