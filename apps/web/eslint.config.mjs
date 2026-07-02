import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import whisperConfig from "@whisper/config/eslint";

const eslintConfig = defineConfig([
  ...whisperConfig,
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".vinext/**",
    ".wrangler/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
    "**/paraglide/**",
  ]),
]);

export default eslintConfig;
