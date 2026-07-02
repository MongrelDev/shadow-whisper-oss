import { cloudflare } from "@cloudflare/vite-plugin";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["cloudflare:workers"],
  },
  plugins: [
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./paraglide",
      outputStructure: "message-modules",
      strategy: ["url", "cookie", "baseLocale"],
      urlPatterns: [
        {
          pattern: "/:path(.*)?",
          localized: [
            ["pt-BR", "/pt-BR/:path(.*)?"],
            ["en", "/:path(.*)?"],
          ],
        },
      ],
    }),
    vinext(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
  ],
});
