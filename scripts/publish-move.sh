#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../move"
sui client switch --env testnet
sui move build
sui client publish --gas-budget 100000000 --json
