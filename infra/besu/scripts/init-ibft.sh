#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
BESU_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
TREASURY_ADDRESS=${TREASURY_ADDRESS:-0x695658fC245ABbaDD7a276fF73Ed44f7374275D1}
REGENERATE=${1:-}

if [[ "${REGENERATE}" == "--regenerate" ]]; then
  echo "[+] Forcing regeneration of validator keys"
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required to generate private keys" >&2
  exit 1
fi

if ! python3 -c "import eth_account" >/dev/null 2>&1; then
  echo "python3 with eth-account is required. Install with: pip install eth-account" >&2
  exit 1
fi

NODES=(node1 node2 node3)
PORTS=(30303 30304 30305)
ADDRS=()
PUBS=()

for idx in "${!NODES[@]}"; do
  NODE="${NODES[$idx]}"
  PORT="${PORTS[$idx]}"
  KEY_DIR="$BESU_DIR/$NODE/keys"
  mkdir -p "$KEY_DIR"
  PRIV_FILE="$KEY_DIR/key.priv"

  if [[ ! -f "$PRIV_FILE" || "${REGENERATE}" == "--regenerate" ]]; then
    echo "[+] Generating new private key for $NODE"
    openssl rand -hex 32 >"$PRIV_FILE.tmp"
    mv "$PRIV_FILE.tmp" "$PRIV_FILE"
    chmod 600 "$PRIV_FILE"
  else
    echo "[=] Using existing private key for $NODE"
  fi

  read -r ADDRESS PUBKEY < <(
    python3 - <<'PY'
import sys
from eth_account import Account
priv_path = sys.argv[1]
with open(priv_path, 'r') as fh:
    priv_hex = fh.read().strip()
acct = Account.from_key(bytes.fromhex(priv_hex))
print(acct.address, acct._key_obj.public_key.to_hex()[2:])
PY
"$PRIV_FILE"
  )

  echo "$ADDRESS" >"$KEY_DIR/address"
  echo "$PUBKEY" >"$KEY_DIR/key.pub"

  ADDRS+=("$ADDRESS")
  PUBS+=("$PUBKEY")

  echo "    address: $ADDRESS"
  echo "    public key: $PUBKEY"
done

export NODES_STR=$(IFS=,; echo "${NODES[*]}")
export PORTS_STR=$(IFS=,; echo "${PORTS[*]}")
export ADDRS_STR=$(IFS=,; echo "${ADDRS[*]}")
export PUBS_STR=$(IFS=,; echo "${PUBS[*]}")
export TREASURY_ADDRESS
export STATIC_NODES_JSON="$BESU_DIR/static-nodes.json"
export PERMISSIONS_TOML="$BESU_DIR/permissions.toml"
export GENESIS_JSON="$BESU_DIR/genesis.json"

python3 - <<'PY'
import json
import os
from pathlib import Path

nodes = os.environ["NODES_STR"].split(",")
ports = os.environ["PORTS_STR"].split(",")
addresses = os.environ["ADDRS_STR"].split(",")
pubkeys = os.environ["PUBS_STR"].split(",")
treasury = os.environ["TREASURY_ADDRESS"]

static_nodes = [
    f"enode://{pub}@{node}:{port}?discport=0"
    for node, port, pub in zip(nodes, ports, pubkeys)
]
Path(os.environ["STATIC_NODES_JSON"]).write_text(json.dumps(static_nodes, indent=2) + "\n")

permissions = "nodes-whitelist=[\n" + ",\n".join(
    f"  \"enode://{pub}@{node}:{port}\"" for node, port, pub in zip(nodes, ports, pubkeys)
) + "\n]\n"
Path(os.environ["PERMISSIONS_TOML"]).write_text(permissions)

genesis_path = Path(os.environ["GENESIS_JSON"])
if not genesis_path.exists():
    raise SystemExit(f"Genesis file not found: {genesis_path}")

genesis = json.loads(genesis_path.read_text())
config = genesis.setdefault("config", {})
ibft = config.setdefault("ibft2", {})
ibft["validators"] = addresses
alloc = genesis.setdefault("alloc", {})
for addr in addresses:
    alloc.setdefault(addr, {"balance": "0x21e19e0c9bab2400000"})
alloc.setdefault(treasury, {"balance": "0xd3c21bcecceda1000000"})

genesis_path.write_text(json.dumps(genesis, indent=2) + "\n")
PY

echo "[+] Updated static-nodes.json, permissions.toml, and genesis.json"
echo "[i] Validator addresses:"
for addr in "${ADDRS[@]}"; do
  echo "  - $addr"
done

echo "[i] Bring up the network with:"
echo "    cd $BESU_DIR && docker compose up -d"
