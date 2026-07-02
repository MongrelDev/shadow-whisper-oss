#!/usr/bin/env bash
# Cross-compiles windows-text-monitor.c using MinGW-w64.
# Native builds on Windows use: cl /O2 windows-text-monitor.c /Fe:windows-text-monitor.exe ole32.lib oleaut32.lib
set -euo pipefail

SRC="$(dirname "$0")/../helpers/windows-text-monitor.c"
OUT_DIR="$(dirname "$0")/../resources-build"
mkdir -p "$OUT_DIR"

if command -v x86_64-w64-mingw32-gcc &>/dev/null; then
  CC=x86_64-w64-mingw32-gcc
elif command -v gcc &>/dev/null && [[ "$(uname -s)" == MINGW* || "$(uname -s)" == MSYS* ]]; then
  CC=gcc
else
  echo "windows-text-monitor: skipping (no MinGW-w64 or Windows gcc found)" >&2
  exit 0
fi

$CC -O2 "$SRC" -o "$OUT_DIR/windows-text-monitor.exe" -lole32 -loleaut32 -luuid
echo "Built windows-text-monitor.exe"
