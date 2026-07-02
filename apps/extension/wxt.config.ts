import { defineConfig } from "wxt";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { resolve } from "path";

const releaseVersion = process.env.RELEASE_VERSION || "0.0.0-dev";
const manifestVersion = releaseVersion.replace(/[-+].*$/, "") || "0.0.0";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [
      paraglideVitePlugin({
        project: resolve(__dirname, "project.inlang"),
        outdir: resolve(__dirname, "paraglide"),
        outputStructure: "message-modules",
        strategy: ["localStorage", "preferredLanguage", "baseLocale"],
      }),
    ],
  }),
  webExt: {
    binaries: {
      chrome: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    },
    chromiumProfile: resolve(".wxt/edge-debug-profile"),
    keepProfileChanges: true,
    chromiumArgs: [
      "--exclude-switches=enable-automation",
      "--disable-blink-features=AutomationControlled",
    ],
  },
  manifest: {
    name: "Shadow Whisper",
    description: "Voice-to-text transcription — speak, transcribe, insert.",
    version: manifestVersion,
    version_name: releaseVersion,
    minimum_chrome_version: "116",
    permissions: [
      "sidePanel",
      "storage",
      "scripting",
      "activeTab",
      "alarms",
      "identity",
      "offscreen",
      "tabs",
      "downloads",
      "clipboardWrite",
      "contextMenus",
    ],
    commands: {
      _execute_action: {},
      "start-recording": {
        suggested_key: { default: "Alt+Shift+W", mac: "Alt+Space" },
        description: "Start/stop recording",
      },
    },
    host_permissions: [
      "<all_urls>",
      "https://workers.shadow-whisper.com/*",
      "http://localhost:8787/*",
    ],
    icons: {
      16: "/icon-16.png",
      32: "/icon-32.png",
      48: "/icon-48.png",
      128: "/icon-128.png",
    },
    action: {
      default_title: "Shadow Whisper",
      default_icon: {
        16: "/icon-16.png",
        32: "/icon-32.png",
        48: "/icon-48.png",
        128: "/icon-128.png",
      },
    },
  },
});
