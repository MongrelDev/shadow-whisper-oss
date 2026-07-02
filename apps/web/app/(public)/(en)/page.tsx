import type { Metadata } from "next";

import { m } from "~/paraglide/messages";

import { HomePage } from "../_home/home-page";

const locale = "en" as const;

export function generateMetadata(): Metadata {
  return {
    title: m.home_meta_title({}, { locale }),
    description: m.home_meta_description({}, { locale }),
    alternates: {
      canonical: "/",
      languages: {
        en: "/",
        "pt-BR": "/pt-BR/",
        "x-default": "/",
      },
    },
    openGraph: {
      locale: "en_US",
      alternateLocale: ["pt_BR"],
    },
  };
}

export default async function Home(): Promise<React.ReactElement> {
  return <HomePage locale={locale} currentPath="/" />;
}
