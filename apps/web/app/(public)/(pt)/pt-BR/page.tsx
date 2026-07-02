import type { Metadata } from "next";

import { m } from "~/paraglide/messages";

import { HomePage } from "../../_home/home-page";

const locale = "pt-BR" as const;

export function generateMetadata(): Metadata {
  return {
    title: m.home_meta_title({}, { locale }),
    description: m.home_meta_description({}, { locale }),
    alternates: {
      canonical: "/pt-BR/",
      languages: {
        en: "/",
        "pt-BR": "/pt-BR/",
        "x-default": "/",
      },
    },
    openGraph: {
      locale: "pt_BR",
      alternateLocale: ["en_US"],
    },
  };
}

export default async function HomePtBr(): Promise<React.ReactElement> {
  return <HomePage locale={locale} currentPath="/pt-BR/" />;
}
