#!/usr/bin/env bash
set -euo pipefail

if ! command -v wasm-pack &>/dev/null; then
  curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

wasm-pack build --target web --out-dir pkg --release
echo "Built @imprint/taffy-wasm → pkg/"
