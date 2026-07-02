import { useEffect, useState } from "react";

export interface UseAccessibilityStatusResult {
  granted: boolean;
  requestAccess: () => void;
}

/**
 * Tracks macOS accessibility permission, re-checking whenever the window regains
 * focus so the UI reflects a grant the user just made in System Settings.
 */
export function useAccessibilityStatus(): UseAccessibilityStatusResult {
  const [granted, setGranted] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      void window.api.settings.checkAccessibility(false).then((value) => {
        if (!cancelled) setGranted(value);
      });
    };
    check();
    const handleFocus = () => check();
    window.addEventListener("focus", handleFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return {
    granted,
    requestAccess: () => void window.api.settings.checkAccessibility(true),
  };
}
