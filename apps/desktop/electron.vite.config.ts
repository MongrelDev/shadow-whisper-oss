import {
  defineConfig,
  externalizeDepsPlugin,
  loadEnv,
  type ElectronViteConfig,
} from "electron-vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import type { PluginOption } from "vite";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = (x: unknown): PluginOption => x as any;

export default defineConfig(({ mode }): ElectronViteConfig => {
  const env = loadEnv(mode, __dirname);

  return {
    main: {
      plugins: [p(externalizeDepsPlugin({ exclude: ["@whisper/api"] }))],
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, "src/main/index.ts"),
          },
        },
      },
      define: {
        __WORKER_URL__: JSON.stringify(env.VITE_WORKER_URL || ""),
        __WEB_URL__: JSON.stringify(env.VITE_WEB_URL || ""),
      },
    },
    preload: {
      plugins: [p(externalizeDepsPlugin({ exclude: ["@better-auth/electron"] }))],
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, "src/preload/index.ts"),
          },
          output: {
            format: "cjs",
            entryFileNames: "[name].js",
          },
        },
      },
    },
    renderer: {
      root: resolve(__dirname, "src/renderer"),
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, "src/renderer/index.html"),
          },
        },
      },
      plugins: [
        p(
          paraglideVitePlugin({
            project: resolve(__dirname, "project.inlang"),
            outdir: resolve(__dirname, "src/renderer/paraglide"),
            outputStructure: "message-modules",
            strategy: ["localStorage", "preferredLanguage", "baseLocale"],
          })
        ),
        p(
          react({
            babel: {
              plugins: [["babel-plugin-react-compiler", { target: "19" }]],
            },
          })
        ),
      ],
      resolve: {
        alias: {
          "@": resolve(__dirname, "src/renderer"),
          "~": resolve(__dirname, "src/renderer"),
        },
      },
      optimizeDeps: {},
      define: {
        "import.meta.env.VITE_WORKER_URL": JSON.stringify(env.VITE_WORKER_URL),
        "import.meta.env.VITE_WEB_URL": JSON.stringify(env.VITE_WEB_URL),
      },
    },
  };
});
