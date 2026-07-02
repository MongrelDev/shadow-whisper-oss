import { Fragment, useEffect, type ReactNode } from "react";
import { useConfig } from "@/hooks/use-config";
import { getLocale, setLocale, type Locale } from "~/paraglide/runtime";

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps): React.ReactElement {
  const { config } = useConfig();
  const locale = config.preferences.locale as Locale;

  if (getLocale() !== locale) {
    setLocale(locale, { reload: false });
  }

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <Fragment key={locale}>{children}</Fragment>;
}
