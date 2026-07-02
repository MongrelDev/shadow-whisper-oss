import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://docs.shadow-whisper.com",
  output: "static",
  adapter: cloudflare(),
  integrations: [
    starlight({
      title: {
        en: "Shadow Whisper",
        "pt-br": "Shadow Whisper",
      },
      defaultLocale: "root",
      locales: {
        root: {
          label: "English",
          lang: "en",
        },
        "pt-br": {
          label: "Português (Brasil)",
          lang: "pt-BR",
        },
      },
      sidebar: [
        {
          label: "Get Started",
          translations: { "pt-br": "Primeiros Passos" },
          items: [{ slug: "get-started/installation" }, { slug: "get-started/first-dictation" }],
        },
        {
          label: "Modes",
          translations: { "pt-br": "Modos" },
          items: [{ slug: "modes/overview" }, { slug: "modes/custom-modes" }],
        },
        {
          label: "Legal",
          translations: { "pt-br": "Legal" },
          items: [{ slug: "legal/privacy" }, { slug: "legal/terms" }],
        },
        {
          label: "Troubleshooting",
          translations: { "pt-br": "Solução de Problemas" },
          items: [{ slug: "troubleshooting/overview" }, { slug: "troubleshooting/report-issue" }],
        },
      ],
      pagefind: true,
      lastUpdated: true,
    }),
  ],
});
