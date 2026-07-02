import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      complexity: ["error", 6],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow tagged template literals as statements (e.g. this.sql`...`, html`...`)
      "@typescript-eslint/no-unused-expressions": ["error", { allowTaggedTemplates: true }],
      "no-undef": "off",
    },
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/.astro/**",
      "**/.next/**",
      "**/.output/**",
      "**/.wrangler/**",
      "**/.wxt/**",
      "**/out/**",
      "**/paraglide/**",
      "apps/worker/worker-configuration.d.ts",
      "**/worker-configuration.d.ts",
      ".agents/**",
      ".claude/**",
      ".codex/**",
      ".opencode/**",
    ],
  }
);
