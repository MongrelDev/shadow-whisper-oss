// Compiles the Swift half of the macOS native module into a universal static
// library that binding.gyp links into native_input.node. No-op off macOS so the
// same build:native scripts work on Windows/Linux runners.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

if (process.platform !== "darwin") {
  process.exit(0);
}

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(packageRoot, "src", "macos", "NativeInputMac.swift");
const outDir = join(packageRoot, "build-swift");
const universal = join(outDir, "libNativeInputMac.a");

const ARCHS = [
  { arch: "arm64", target: "arm64-apple-macos11.0" },
  { arch: "x86_64", target: "x86_64-apple-macos11.0" },
];

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const slices = ARCHS.map(({ arch, target }) => {
  const slice = join(outDir, `libNativeInputMac-${arch}.a`);
  execFileSync(
    "swiftc",
    [
      "-emit-library",
      "-static",
      "-O",
      "-swift-version",
      "5",
      "-module-name",
      "NativeInputMac",
      "-target",
      target,
      "-o",
      slice,
      source,
    ],
    { stdio: "inherit" }
  );
  return slice;
});

execFileSync("lipo", ["-create", "-output", universal, ...slices], { stdio: "inherit" });
console.log(`[native-input] built ${universal} (${ARCHS.map((a) => a.arch).join(" + ")})`);
