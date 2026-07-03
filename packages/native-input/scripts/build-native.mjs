// Install-time native build so a clean `pnpm install` leaves the package ready
// to import. Order matters: the Swift static lib must exist before node-gyp
// links it (the implicit `node-gyp rebuild` skipped it and failed to link), and
// consumers import the compiled `dist/index.js`, so tsc must run too. Linux uses
// the pure-TS implementation (src/linux.ts), so only node-gyp is skipped there.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, "..");
const require = createRequire(import.meta.url);
const runNode = (args) =>
  execFileSync(process.execPath, args, { stdio: "inherit", cwd: packageRoot });

runNode([join(here, "build-swift-macos.mjs")]);

if (process.platform !== "linux") {
  runNode([require.resolve("node-gyp/bin/node-gyp.js"), "rebuild"]);
}

runNode([require.resolve("typescript/bin/tsc")]);
