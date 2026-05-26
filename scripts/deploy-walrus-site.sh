#!/usr/bin/env bash
set -euo pipefail

npm run build
cp public/ws-resources.json out/ws-resources.json
site-builder deploy --epochs 3 out
