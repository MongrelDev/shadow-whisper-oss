// electron.vite.config.ts
import { defineConfig, externalizeDepsPlugin, loadEnv } from "electron-vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
var __electron_vite_injected_dirname =
  "/Users/mongrel/code/shadow-corp/shadow-whisper/apps/desktop";
var p = (x) => x;
var electron_vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, __electron_vite_injected_dirname);
  return {
    main: {
      plugins: [p(externalizeDepsPlugin({ exclude: ["@whisper/api"] }))],
      build: {
        rollupOptions: {
          input: {
            index: resolve(__electron_vite_injected_dirname, "src/main/index.ts"),
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
            index: resolve(__electron_vite_injected_dirname, "src/preload/index.ts"),
          },
          output: {
            format: "cjs",
            entryFileNames: "[name].js",
          },
        },
      },
    },
    renderer: {
      root: resolve(__electron_vite_injected_dirname, "src/renderer"),
      build: {
        rollupOptions: {
          input: {
            index: resolve(__electron_vite_injected_dirname, "src/renderer/index.html"),
          },
        },
      },
      plugins: [
        p(
          paraglideVitePlugin({
            project: resolve(__electron_vite_injected_dirname, "project.inlang"),
            outdir: resolve(__electron_vite_injected_dirname, "src/renderer/paraglide"),
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
          "@": resolve(__electron_vite_injected_dirname, "src/renderer"),
          "~": resolve(__electron_vite_injected_dirname, "src/renderer"),
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
export { electron_vite_config_default as default };
