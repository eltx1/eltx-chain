#!/usr/bin/env bash
set -euo pipefail

MIN_PRICE_WEI=${1:-1000000000}
RPC_ENDPOINT=${RPC_ENDPOINT:-${RPC_URL:-http://127.0.0.1:8545}}

PAYLOAD=$(cat <<JSON
{"jsonrpc":"2.0","method":"miner_setMinGasPrice","params":["0x$(printf '%x' "$MIN_PRICE_WEI")"],"id":1}
JSON
)

echo "[i] Setting min gas price to $MIN_PRICE_WEI wei via $RPC_ENDPOINT"
RESPONSE=$(curl -sSf -H 'Content-Type: application/json' --data "$PAYLOAD" "$RPC_ENDPOINT")
echo "$RESPONSE"
