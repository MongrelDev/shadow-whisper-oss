import baseConfig from "@whisper/config/eslint";
import tseslint from "typescript-eslint";

export default tseslint.config(...baseConfig, {
  files: ["src/**/*.ts"],
  languageOptions: {
    parserOptions: {
      projectService: true,
    },
  },
  rules: {
    "@typescript-eslint/no-floating-promises": "error",
  },
});
