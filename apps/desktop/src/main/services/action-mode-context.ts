export interface ActionModeContext {
  targetPid: number | null;
  targetWindowHandle: number | null;
  selectedText: string | null;
  bundleId: string | null;
}

let current: ActionModeContext | null = null;

export function beginActionModeContext(context: ActionModeContext): ActionModeContext {
  current = context;
  return current;
}

export function getActionModeContext(): ActionModeContext | null {
  return current;
}

export function consumeActionModeContext(): ActionModeContext | null {
  const ctx = current;
  current = null;
  return ctx;
}
