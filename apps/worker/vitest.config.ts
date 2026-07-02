import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: "./wrangler.toml",
      },
    }),
  ],
  test: {
    fileParallelism: false,
    include: ["test/**/*.spec.ts", "src/**/*.test.ts"],
    setupFiles: ["./test/setup/runtime.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
