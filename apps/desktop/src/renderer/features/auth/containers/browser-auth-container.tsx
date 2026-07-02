import { useState } from "react";
import { useBrowserAuth } from "../hooks/use-browser-auth";
import { BrowserAuthPanel } from "../components/browser-auth-panel";

export function BrowserAuthContainer(): React.ReactElement {
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const auth = useBrowserAuth({ onRequestSuccess: () => setFallbackOpen(false) });

  return (
    <BrowserAuthPanel
      onRequestAuth={auth.requestAuth}
      isRequestingAuth={auth.isRequestingAuth}
      requestError={auth.requestError}
      requestSucceeded={auth.requestSucceeded}
      fallbackOpen={fallbackOpen}
      onFallbackOpenChange={setFallbackOpen}
      onAuthenticate={auth.authenticate}
      isAuthenticating={auth.isAuthenticating}
      authError={auth.authError}
    />
  );
}
