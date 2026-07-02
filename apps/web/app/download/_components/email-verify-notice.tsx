import { Mail } from "lucide-react";

import { m } from "~/paraglide/messages";

interface EmailVerifyNoticeProps {
  email: string;
}

export function EmailVerifyNotice({ email }: EmailVerifyNoticeProps): React.ReactElement {
  return (
    <div className="mt-10 rounded-lg border border-primary/20 bg-primary/5 px-5 py-4">
      <div className="flex items-start gap-3.5">
        <Mail className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium leading-snug text-foreground">
            {m.download_verify_title()}
          </p>
          <p className="mt-1.5 text-[13px] leading-[1.6] text-muted-foreground">
            {m.download_verify_description({ email })}
          </p>
          <p className="mt-2 text-[12px] text-muted-foreground/80">
            {m.download_verify_spam_hint()}
          </p>
        </div>
      </div>
    </div>
  );
}
