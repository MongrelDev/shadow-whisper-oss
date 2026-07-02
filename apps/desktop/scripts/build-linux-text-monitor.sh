#!/usr/bin/env bash
# Compiles linux-text-monitor.c using AT-SPI2.
# Falls back to bundling the Python script if libatspi headers are missing.
set -euo pipefail

SRC="$(dirname "$0")/../helpers/linux-text-monitor.c"
PY_SRC="$(dirname "$0")/../helpers/linux-text-monitor.py"
OUT_DIR="$(dirname "$0")/../resources-build"
mkdir -p "$OUT_DIR"

if pkg-config --exists atspi-2 2>/dev/null; then
  CFLAGS=$(pkg-config --cflags atspi-2)
  LIBS=$(pkg-config --libs atspi-2)
  gcc -O2 $CFLAGS "$SRC" -o "$OUT_DIR/linux-text-monitor" $LIBS
  chmod +x "$OUT_DIR/linux-text-monitor"
  echo "Built linux-text-monitor (C/AT-SPI2)"
else
  echo "libatspi-dev not found; bundling Python fallback" >&2
  cp "$PY_SRC" "$OUT_DIR/linux-text-monitor.py"
  chmod +x "$OUT_DIR/linux-text-monitor.py"
  echo "Bundled linux-text-monitor.py"
fi
