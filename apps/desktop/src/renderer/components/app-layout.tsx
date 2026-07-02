import { useEffect } from "react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { Sidebar } from "./sidebar";
import { AppHeader } from "./app-header";
import { useConfig } from "../hooks/use-config";
import { OnboardingModalContainer } from "../features/onboarding/containers/onboarding-modal-container";
import { SettingsModal } from "../features/settings-main/modals/settings-modal";
import { DeleteAudioModal } from "../features/settings-main/modals/delete-audio-modal";

function useAppNavigateListener(): void {
  const navigate = useNavigate();
  useEffect(() => {
    return window.api.app.onNavigate(({ route }) => {
      void navigate({ to: route as "/app/skills" });
    });
  }, [navigate]);
}

export function AppLayout(): React.ReactElement {
  const { config, updateConfig } = useConfig();
  useAppNavigateListener();
  const collapsed = config.ui.sidebarCollapsed;

  const handleToggle = () => {
    updateConfig({ ui: { sidebarCollapsed: !collapsed } });
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Titlebar — full width, fixed at top, same level as macOS traffic lights */}
      <AppHeader collapsed={collapsed} onToggle={handleToggle} />

      {/* Below titlebar: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={collapsed} />

        {/* Content area — elevated card effect */}
        <div className="flex-1 flex flex-col overflow-hidden m-2 ml-0 rounded-2xl bg-card border border-border shadow-sm">
          <main className="flex-1 overflow-auto">
            <div className="max-w-[1440px] mx-auto px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <OnboardingModalContainer />
      <SettingsModal />
      <DeleteAudioModal />
    </div>
  );
}
