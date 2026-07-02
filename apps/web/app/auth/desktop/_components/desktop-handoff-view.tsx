"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { m } from "~/paraglide/messages";

function getDesktopAuthCode(): string | null {
  const electron = (authClient as { electron?: { getAuthorizationCode?: () => unknown } }).electron;
  const code = electron?.getAuthorizationCode?.();
  return typeof code === "string" && code.length > 0 ? code : null;
}

export function DesktopHandoffView(): React.ReactElement {
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sync = () => {
      const code = getDesktopAuthCode();
      if (code) setAuthCode(code);
    };
    sync();
    const id = authClient.ensureElectronRedirect();
    const pollId = window.setInterval(sync, 500);
    return () => {
      window.clearTimeout(id);
      window.clearInterval(pollId);
    };
  }, []);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(id);
  }, [copied]);

  const handleCopy = async () => {
    if (!authCode) return;
    await navigator.clipboard.writeText(authCode);
    setCopied(true);
  };

  return (
    <div className="space-y-4 rounded-md border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
      <p>{m.auth_desktop_handoff_redirect()}</p>
      <p>{m.auth_desktop_handoff_fallback()}</p>
      {authCode ? (
        <div className="space-y-2">
          <Label htmlFor="desktop-auth-code">{m.auth_desktop_handoff_code_label()}</Label>
          <div className="flex gap-2">
            <Input id="desktop-auth-code" readOnly value={authCode} className="font-mono text-xs" />
            <Button type="button" variant="outline" onClick={() => void handleCopy()}>
              <CopyIcon copied={copied} />
              {copied ? m.auth_desktop_handoff_copied() : m.auth_desktop_handoff_copy()}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs italic">{m.auth_desktop_handoff_missing_code()}</p>
      )}
    </div>
  );
}

function CopyIcon({ copied }: { copied: boolean }): React.ReactElement {
  return copied ? (
    <Check className="mr-2 size-4" aria-hidden="true" />
  ) : (
    <Copy className="mr-2 size-4" aria-hidden="true" />
  );
}
