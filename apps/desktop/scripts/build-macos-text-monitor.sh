#!/usr/bin/env bash
set -euo pipefail
SRC="$(dirname "$0")/../helpers/macos-text-monitor.swift"
OUT_DIR="$(dirname "$0")/../resources-build"
mkdir -p "$OUT_DIR"
swiftc -O "$SRC" -o "$OUT_DIR/macos-text-monitor"
chmod +x "$OUT_DIR/macos-text-monitor"
