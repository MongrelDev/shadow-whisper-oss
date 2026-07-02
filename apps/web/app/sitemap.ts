import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

import { MARKETING_ROUTES, MARKETING_TOPICS } from "./(public)/_marketing/lib/routes";

const utilityRoutes = [
  "/sign-up",
  "/sign-up/error",
  "/download",
  "/purchase/success",
  "/purchase/cancelled",
  "/error",
] as const;

function marketingEntries(lastModified: Date): MetadataRoute.Sitemap {
  return MARKETING_TOPICS.flatMap((topic) => {
    const slugs = MARKETING_ROUTES[topic];
    const ptUrl = absoluteUrl(`/pt-BR${slugs.pt}`);
    const languages: Record<string, string> = { "pt-BR": ptUrl };

    if (slugs.en) {
      languages.en = absoluteUrl(slugs.en);
      languages["x-default"] = languages.en;
    } else {
      languages["x-default"] = ptUrl;
    }

    const urls = slugs.en ? [absoluteUrl(slugs.en), ptUrl] : [ptUrl];
    return urls.map((url) => ({
      url,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: { languages },
    }));
  });
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      alternates: {
        languages: {
          en: absoluteUrl("/"),
          "pt-BR": absoluteUrl("/pt-BR/"),
          "x-default": absoluteUrl("/"),
        },
      },
    },
    ...marketingEntries(lastModified),
    ...utilityRoutes.map((route) => ({
      url: absoluteUrl(route),
      lastModified,
    })),
  ];
}
