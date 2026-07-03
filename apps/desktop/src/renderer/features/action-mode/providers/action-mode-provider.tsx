import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import {
  useActionModeSession,
  type UseActionModeSessionReturn,
} from "../hooks/use-action-mode-session";

interface ActionModeContextValue {
  actionSession: UseActionModeSessionReturn;
}

const ActionModeContext = createContext<ActionModeContextValue | null>(null);

export function ActionModeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const actionSession = useActionModeSession();

  const sessionRef = useRef(actionSession);
  sessionRef.current = actionSession;

  useEffect(() => {
    const cleanupStart = window.api.actionMode.onStart(() => {
      void sessionRef.current.start();
    });
    // The main process reuses the shared recording stop/cancel broadcasts for
    // action mode; each session type only reacts when it is the active one.
    const cleanupStop = window.api.recording.onStop(() => {
      if (sessionRef.current.phase === "recording") void sessionRef.current.stop();
    });
    const cleanupCancel = window.api.recording.onCancelShortcut(() => {
      if (sessionRef.current.phase !== "idle") void sessionRef.current.cancel();
    });
    return () => {
      cleanupStart();
      cleanupStop();
      cleanupCancel();
    };
  }, []);

  const value = useMemo<ActionModeContextValue>(() => ({ actionSession }), [actionSession]);

  return <ActionModeContext.Provider value={value}>{children}</ActionModeContext.Provider>;
}

export function useActionModeContext(): ActionModeContextValue {
  const context = useContext(ActionModeContext);
  if (!context) {
    throw new Error("useActionModeContext must be used within ActionModeProvider");
  }
  return context;
}
