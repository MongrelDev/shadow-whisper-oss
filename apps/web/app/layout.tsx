import { cache } from "react";
import { headers } from "next/headers";
import type { Metadata } from "next";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";

import {
  assertIsLocale,
  baseLocale,
  getLocale,
  getTextDirection,
  overwriteGetLocale,
  overwriteGetUrlOrigin,
  type Locale,
} from "~/paraglide/runtime";
import { PostHogProvider } from "@/components/posthog-provider";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const ssrLocale = cache(() => ({
  locale: baseLocale as Locale,
  origin: siteConfig.url,
}));

overwriteGetLocale(() => assertIsLocale(ssrLocale().locale));
overwriteGetUrlOrigin(() => ssrLocale().origin);

export const dynamic = "force-dynamic";

function resolveRequestOrigin(headerUrl: string | null): string {
  if (headerUrl) {
    return new URL(headerUrl).origin;
  }

  return siteConfig.url;
}

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const origin = resolveRequestOrigin(h.get("x-paraglide-request-url"));

  return {
    metadataBase: new URL(origin),
    applicationName: siteConfig.name,
    title: {
      default: siteConfig.title,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    alternates: {
      canonical: "/",
      languages: {
        en: "/",
        "pt-BR": "/pt-BR",
        "x-default": "/",
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      alternateLocale: ["pt_BR"],
      url: "/",
      siteName: siteConfig.name,
      title: siteConfig.title,
      description: siteConfig.description,
      images: [
        {
          url: "/app-icon.png",
          width: 1024,
          height: 1024,
          alt: "Shadow Whisper",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: siteConfig.title,
      description: siteConfig.description,
      images: ["/app-icon.png"],
    },
    icons: {
      icon: "/app-icon.png",
      apple: "/app-icon.png",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const headerLocale = h.get("x-paraglide-locale");
  const headerUrl = h.get("x-paraglide-request-url");
  if (headerLocale) ssrLocale().locale = headerLocale as Locale;
  if (headerUrl) ssrLocale().origin = new URL(headerUrl).origin;

  return (
    <html lang={getLocale()} dir={getTextDirection()} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
