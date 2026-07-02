import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { m } from "~/paraglide/messages";
import { Button } from "@/components/ui/button";

interface InviteLinkCardProps {
  code: string;
  inviteUrl: string;
}

export function InviteLinkCard({ inviteUrl }: InviteLinkCardProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success(m.affiliate_copy_success());
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(m.affiliate_copy_error());
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1 rounded-lg border border-border bg-muted/30 px-3.5 py-2.5">
        <p className="text-sm font-mono truncate text-muted-foreground">{inviteUrl}</p>
      </div>
      <Button
        variant={copied ? "outline" : "default"}
        size="sm"
        className="shrink-0 gap-1.5"
        onClick={handleCopy}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? m.affiliate_invite_button_copied() : m.affiliate_invite_button_copy()}
      </Button>
    </div>
  );
}
