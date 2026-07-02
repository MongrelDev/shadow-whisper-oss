import { useNavigate, useSearch } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { m } from "~/paraglide/messages";
import { AppearanceSection } from "../components/appearance-section";
import { LanguagesSection } from "../components/languages-section";
import { ShortcutsContainer } from "../containers/shortcuts-container";
import { GeneralSection } from "../components/general-section";
import { LearningSection } from "../components/learning-section";
import { AccountContainer } from "../containers/account-container";
import { AboutSection } from "../components/about-section";
import { SectionHeader } from "../components/section-header";
import { SettingsNavRail } from "../components/settings-nav-rail";
import { DEFAULT_SETTINGS_SECTION, type SettingsSection } from "../types/section";

interface SectionMeta {
  title: () => string;
  description: () => string;
  render: () => React.ReactNode;
}

const SECTIONS: Record<SettingsSection, SectionMeta> = {
  account: {
    title: () => m.settings_nav_account(),
    description: () => m.settings_section_account_description(),
    render: () => <AccountContainer />,
  },
  appearance: {
    title: () => m.settings_nav_appearance(),
    description: () => m.settings_section_appearance_description(),
    render: () => <AppearanceSection />,
  },
  languages: {
    title: () => m.settings_nav_languages(),
    description: () => m.settings_section_languages_description(),
    render: () => <LanguagesSection />,
  },
  recording: {
    title: () => m.settings_nav_recording(),
    description: () => m.settings_section_recording_description(),
    render: () => <GeneralSection />,
  },
  shortcuts: {
    title: () => m.settings_nav_shortcuts(),
    description: () => m.settings_section_shortcuts_description(),
    render: () => <ShortcutsContainer />,
  },
  learning: {
    title: () => m.settings_nav_learning(),
    description: () => m.settings_section_learning_description(),
    render: () => <LearningSection />,
  },
  about: {
    title: () => m.settings_nav_about(),
    description: () => m.settings_section_about_description(),
    render: () => <AboutSection />,
  },
};

export function SettingsModal(): React.ReactElement | null {
  const search = useSearch({ from: "/app-shell/protected/app" });
  const navigate = useNavigate();

  const isOpen = search.settings === "open";
  const active: SettingsSection = search.section ?? DEFAULT_SETTINGS_SECTION;
  const meta = SECTIONS[active];

  const close = () => {
    navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        settings: undefined,
        section: undefined,
        confirm: undefined,
      }),
    });
  };

  const setSection = (section: SettingsSection) => {
    navigate({
      to: ".",
      search: (prev) => ({ ...prev, settings: "open", section }),
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        hideClose
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="flex h-[min(760px,calc(100vh-64px))] w-[min(1080px,calc(100vw-64px))] max-w-none translate-x-[-50%] translate-y-[-50%] gap-0 overflow-hidden rounded-2xl border border-border bg-background p-0 shadow-2xl"
      >
        <DialogTitle className="sr-only">{m.settings_page_title()}</DialogTitle>

        <SettingsNavRail active={active} onSelect={setSection} />

        <div className="relative flex-1 overflow-y-auto px-12 pb-16 pt-9">
          <button
            type="button"
            onClick={close}
            aria-label={m.settings_modal_close()}
            className="absolute right-5 top-5 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          <SectionHeader title={meta.title()} description={meta.description()} />

          <div className="space-y-4">{meta.render()}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
