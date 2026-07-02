import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider, useLocalePreference } from "~/providers/locale-provider";
import { ThemeProvider } from "~/providers/theme-provider";
import { router } from "~/routes/router";
import "./style.css";

const queryClient = new QueryClient();

function AppRoot() {
  const { locale } = useLocalePreference();
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} key={locale} />
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <LocaleProvider>
        <AppRoot />
      </LocaleProvider>
    </ThemeProvider>
  </StrictMode>
);
