# ELTX Chain Monorepo

This repository packages the full production stack for the ELTX Chain IBFT2 network on Hyperledger Besu. It contains:

- Besu validator infrastructure with Docker Compose, genesis, and management scripts.
- Blockscout explorer deployment with custom branding.
- ERC-20 contracts (ELTX, USDTE, WELTX) plus bundled Uniswap V2 core & periphery.
- Hardhat deployments, liquidity seeding, and automated tests.
- Node.js faucet service with rate limits and PM2 configuration.
- Next.js swap UI, plus a static "Add Network" helper page.
- Apache reverse proxy snippets, security guidance, and CI automation.

## Quick Start

```bash
git clone https://github.com/eltx-chain/eltx-chain.git
cd eltx-chain
cp .env.example .env
```

### 1. Generate Validator Keys and Genesis

```bash
cd infra/besu
./scripts/init-ibft.sh      # generates/updates node keys, static-nodes, permissions, and genesis
```

The script relies on `openssl` and Python with `eth-account`. To regenerate keys: `./scripts/init-ibft.sh --regenerate`.

### 2. Launch the Besu Validators

```bash
./scripts/start-all.sh
```

This brings up three validators (node1-node3) on ports 8545/8546, 8645/8646, 8745/8746 with metrics enabled. Logs and lifecycle helpers:

```bash
./scripts/logs.sh            # follow logs for all services
./scripts/stop-all.sh        # stop and remove containers
./scripts/set-gasprice.sh 1000000000   # set min gas price to 1 gwei
```

Validators reward the treasury address `0x695658fC245ABbaDD7a276fF73Ed44f7374275D1` as the mining beneficiary.

### 3. Expose RPC Behind Apache + Cloudflare

1. Proxy Besu via Apache using the snippets in `infra/reverse-proxy/apache/`. Example vhost:
   - `eltx-rpc-htaccess.conf` enforces CORS for `https://eltx.online` and rate limits.
   - Restrict inbound IPs to Cloudflare ranges.
2. Set Cloudflare DNS (orange cloud) for:
   - `rpc.eltx.online` → Apache upstream (Full SSL, HTTP/2 enabled).
   - `explorer.eltx.online`, `faucet.eltx.online` with caching bypass rules for `/api` and `/drip`.
3. Enable Cloudflare WAF "API Shield" to throttle abnormal RPC traffic.

### 4. Deploy Contracts & Seed Liquidity

```bash
cd deploy
npm install
npx hardhat compile
npx hardhat test
```

Populate `.env` (copy from `.env.example`) with `RPC_URL`, `TREASURY_ADDRESS`, and `DEPLOYER_KEY` (treasury signer). Then run:

```bash
npx hardhat deploy-all --network eltx
npx hardhat seed-liquidity --network eltx
npx hardhat print-addresses
```

Deployment addresses are written to `deploy/scripts/deployments/<network>.json` and mirrored in `deploy/verify_addresses.json` for Blockscout verification.

### 5. Run Blockscout Explorer

```bash
cd ../infra/blockscout
docker compose up -d
```

Blockscout listens on port `4000` with healthchecks on `4001`. Customize branding via `chain-config.json` and `branding/eltx-logo.svg`. Expose publicly via Apache (`eltx-explorer-htaccess.conf`).

### 6. Faucet Service

```bash
cd ../../apps/faucet
cp .env.example .env
npm install
npm run build
pm2 start pm2.config.cjs
```

Environment variables:
- `RPC_URL`, `FAUCET_PRIVATE_KEY`
- `DRIP_AMOUNT` (default 0.5 ELTX)
- `COOLDOWN_HOURS` (24h default)

The `/drip` endpoint enforces per-IP and per-address limits via `rate-limiter-flexible`. Integrate a captcha by supplying `CAPTCHA_SECRET` and wiring verification in `src/index.ts`.

### 7. Swap UI

```bash
cd ../swap-ui
cp .env.example .env.local   # fill in deployed addresses
npm install
npm run dev
```

Build for production with `npm run build && npm run start`. Serve behind Apache using Cloudflare caching. The UI auto-configures wallets using `wallet_addEthereumChain` and reads balances via Wagmi.

### 8. Add-Network Landing Page

Host `apps/add-network/index.html` on a static bucket or CDN. It provides a one-click button to add ELTX Chain to MetaMask-compatible wallets (chainId `0x4F2A0`).

## Operations Runbook

1. **Backups**: Snapshot validator data directories (`infra/besu/node*/data`) and Blockscout Postgres volume daily.
2. **Metrics & Healthchecks**:
   - RPC: `curl https://rpc.eltx.online` (`eth_blockNumber`).
   - Blockscout: `https://explorer.eltx.online/healthz` (200 OK).
   - Faucet: `GET https://faucet.eltx.online/healthz`.
3. **Upgrades**:
   - Add new validator by generating keys via `init-ibft.sh`, updating `genesis.json`, and re-deploying static nodes.
   - To change gas policy, run `set-gasprice.sh <wei>` on all nodes.
4. **Security Checklist**:
   - Rotate `FAUCET_PRIVATE_KEY` monthly and cap hot wallet balance < 500 ELTX.
   - Protect `.env` files with `chmod 600` and restrict server user access.
   - Enable log shipping for Besu, Blockscout, Faucet, and Swap UI (PM2) to centralized logging.
   - Monitor Cloudflare analytics for L7 spikes.
5. **Disaster Recovery**:
   - Bring up replacement validator nodes using backed-up keys and static nodes.
   - Restore Blockscout from Postgres backups (`pg_restore`).
   - Re-deploy contracts only with multisig approval; minted supply resides in treasury account.

### GitHub Push & PR Troubleshooting

لو واجهت مشاكل في `git push` أو إنشاء Pull Request (زي Error 400 اللي بيطلع أحيانًا في تطبيق GitHub)، شوف الدليل التفصيلي في
[`docs/troubleshooting/github-push.md`](docs/troubleshooting/github-push.md). الدليل فيه خطوات تحقق من الريموت، التوكنز، وإزاي
تستخدم GitHub CLI علشان ترفع الفرع وتفتح PR من غير ما تتعطل، وكمان خطة لتقسيم التغييرات على ٣ Push لو محتاج ترفع الشغل على دفعات.

## Directory Layout

- `infra/besu/` — Besu configs, genesis, Docker Compose, and helper scripts.
- `infra/blockscout/` — Blockscout Docker Compose, env, branding, and nginx sample.
- `infra/reverse-proxy/` — Apache vhost and security snippets.
- `contracts/` — Solidity contracts and bundled Uniswap V2 code.
- `deploy/` — Hardhat config, scripts, and unit tests.
- `apps/faucet/` — Express faucet service.
- `apps/swap-ui/` — Next.js DEX frontend.
- `apps/add-network/` — Static wallet helper page.
- `security/THREAT_MODEL.md` — threat model and recommendations.
- `ci/workflows/ci.yml` — GitHub Actions pipeline.

## Testing & QA

Run the automated tests before deployment:

```bash
cd deploy
npx hardhat test
```

Unit tests cover ELTX mint/pause controls, WELTX wrap/unwrap, and Uniswap router swaps. Extend coverage with fuzzing or Foundry tests for additional assurance.

## Postman Collection

Use the following quick commands for smoke tests:

- RPC block number: `curl -X POST https://rpc.eltx.online -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`
- Faucet dry run: `curl -X GET https://faucet.eltx.online/healthz`
- Explorer status: `curl https://explorer.eltx.online/healthz`

## Licensing

- ELTX Chain source is MIT licensed (see `LICENSE`).
- Bundled Uniswap V2 core/periphery remain under GPLv3 (see `contracts/uniswap-v2-*/LICENSE`).
- NOTICE file includes attribution requirements.
