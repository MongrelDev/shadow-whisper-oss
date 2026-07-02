import React from "react";
import ReactDOM from "react-dom/client";
import Dexie from "dexie";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./routes/router";
import { AuthProvider } from "./providers/AuthProvider";
import { InteractionModeProvider } from "./providers/interaction-mode-provider";
import { ThemeProvider } from "./providers/theme-provider";
import { ConfigGuard } from "./providers/config-guard";
import { LocaleProvider } from "./providers/locale-provider";
import { queryClient } from "./lib/query-client";
import { TooltipProvider } from "./components/ui/tooltip";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./styles/globals.css";

void navigator.storage?.persist?.().catch(() => undefined);
if (import.meta.env.DEV) Dexie.debug = true;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <ConfigGuard>
            <InteractionModeProvider>
              <AuthProvider>
                <TooltipProvider delayDuration={200}>
                  <RouterProvider router={router} />
                </TooltipProvider>
              </AuthProvider>
            </InteractionModeProvider>
          </ConfigGuard>
        </LocaleProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
