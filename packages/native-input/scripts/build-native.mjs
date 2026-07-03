// Install-time native build: compile the Swift static lib first (macOS), then
// node-gyp. Runs on `pnpm install` so a clean tree builds in the right order —
// the implicit `node-gyp rebuild` skipped the Swift step and failed to link.
// Linux uses the pure-TS implementation (src/linux.ts), so node-gyp is skipped.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, "..");

execFileSync(process.execPath, [join(here, "build-swift-macos.mjs")], { stdio: "inherit" });

if (process.platform !== "linux") {
  const nodeGyp = createRequire(import.meta.url).resolve("node-gyp/bin/node-gyp.js");
  execFileSync(process.execPath, [nodeGyp, "rebuild"], { stdio: "inherit", cwd: packageRoot });
}
