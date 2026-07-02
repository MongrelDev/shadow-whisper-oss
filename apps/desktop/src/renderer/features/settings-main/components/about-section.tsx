import { Book, MessageCircle, Shield, ScrollText, FileText, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthContext } from "@/hooks/use-auth-context";
import { Button } from "@/components/ui/button";
import { m } from "~/paraglide/messages";
import { SettingsCard, Row, HelpLink } from "./settings-primitives";
import { AppLogo } from "@/components/app-logo";

const WEB_URL = import.meta.env.VITE_WEB_URL?.replace(/\/+$/, "");
const DOCS_URL =
  import.meta.env.VITE_DOCS_URL?.replace(/\/+$/, "") ?? "https://docs.shadow-whisper.com";

function buildWebUrl(path = "/"): string {
  return new URL(path, `${WEB_URL}/`).toString();
}

function buildDocsUrl(path = "/"): string {
  return new URL(path, `${DOCS_URL}/`).toString();
}

export function AboutSection(): React.ReactElement {
  const { signOut } = useAuthContext();
  const navigate = useNavigate();

  const infoLinks = [
    { label: m.settings_about_privacy_link(), icon: Shield, href: buildDocsUrl("/legal/privacy") },
    { label: m.settings_about_terms_link(), icon: ScrollText, href: buildDocsUrl("/legal/terms") },
    { label: m.settings_about_changelog_link(), icon: FileText, href: buildWebUrl("/changelog") },
  ];

  return (
    <>
      <SettingsCard title={m.settings_about_help_title()}>
        <HelpLink
          icon={Book}
          label={m.settings_about_docs_label()}
          sublabel={m.settings_about_docs_sublabel()}
          href={buildDocsUrl("/")}
        />
        <HelpLink
          icon={MessageCircle}
          label={m.settings_about_feedback_label()}
          sublabel={m.settings_about_feedback_sublabel()}
          href={buildWebUrl("/feedback")}
        />
        <div className="pt-2">
          <p className="text-sm text-muted-foreground">
            {m.settings_about_support_prefix()}
            <span className="text-foreground font-medium">suporte@shadowwhisper.app</span>
          </p>
        </div>
      </SettingsCard>

      <SettingsCard title={m.settings_about_title()}>
        <button
          type="button"
          onClick={() => window.api.shell.openExternal(buildWebUrl("/"))}
          className="w-full text-left"
        >
          <Row label="ShadowWhisper" sublabel={m.settings_about_version_sublabel()}>
            <AppLogo className="w-4.5 h-4.5" />
          </Row>
        </button>
        <div className="flex items-center gap-5 pt-2">
          {infoLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(event) => {
                event.preventDefault();
                window.api.shell.openExternal(link.href);
              }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </a>
          ))}
        </div>
      </SettingsCard>

      <Button
        variant="outline"
        className="w-full justify-start gap-3 px-5 py-4 h-auto rounded-xl text-destructive hover:text-destructive hover:bg-destructive/5"
        onClick={async () => {
          await signOut();
          navigate({ to: "/auth/login" });
        }}
      >
        <LogOut className="w-4.5 h-4.5" />
        <span className="text-base font-medium">{m.settings_about_sign_out()}</span>
      </Button>
    </>
  );
}
