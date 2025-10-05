ROLE: Senior DevOps + Solidity + Web3 Full-Stack. 
GOAL: Create a production-ready monorepo “eltx-chain” for an EVM PoA/IBFT2 chain where ELTX is the native gas. Include chain infra, contracts, deployments, explorer, faucet, swap (Uniswap V2), and docs. Output full files, commands, and configs.

========================
1) GLOBAL SPECS (use as defaults)
========================
- Network name: ELTX Chain
- ChainId / NetworkId: 20256
- Consensus: IBFT2 (Proof of Authority) on Hyperledger Besu
- Block time: 2s
- Fee model: Legacy gas (NO EIP-1559). 100% fees go to mining beneficiary.
- Native currency: ELTX (decimals=18)
- Treasury / fee beneficiary (receive ALL gas fees): 0x695658fC245ABbaDD7a276fF73Ed44f7374275D1
- Initial ERC20 supply: 1,000,000,000 ELTX minted to the treasury above (token is mintable by owner).
- Gas price policy: min=1 gwei, typical=1–3 gwei (configurable).
- Domains:
  * RPC public: https://rpc.eltx.online
  * Explorer: https://explorer.eltx.online
  * Faucet: https://faucet.eltx.online
- CORS allowlist: https://eltx.online
- Reverse proxy: Apache behind Cloudflare (generate sample vhost/.htaccess)
- Docker-first deployment; PM2 only for Node services (faucet/swap UI).

========================
2) REPO STRUCTURE
========================
eltx-chain/
  README.md  (complete runbook)
  .env.example (top-level)
  /infra/
    /besu/
      node1/ node2/ node3/                 (3 validators)
      genesis.json                         (IBFT2, chainId=20256, NO EIP-1559)
      permissions.toml (allow only our nodes’ enodes)
      static-nodes.json
      docker-compose.yml (multi-service or one per node)
      scripts/
        init-ibft.sh        (creates keys, clique -> IBFT2 config if needed)
        start-all.sh / stop-all.sh / logs.sh
        set-gasprice.sh     (rpc call to adjust min gas price)
      config/
        besu-opts-nodeX.toml (enable JSON-RPC, ws, txpool; set miningBeneficiary = treasury)
        rpc-cors.txt (include https://eltx.online)
    /blockscout/
      docker-compose.yml + .env
      nginx.conf sample (if needed)
      chain-config.json (custom chain meta: name, currency, explorer branding)
    /bridge/   (placeholder doc for future bridge integration)
    /reverse-proxy/
      apache/
        vhost-examples.md
        eltx-rpc-htaccess.conf   (proxy to besu RPC; rate-limit; CORS headers)
        eltx-faucet-htaccess.conf
        eltx-explorer-htaccess.conf
  /contracts/
    ELTXToken.sol      (ERC20 Ownable Mintable Pausable + Permit; owner = treasury)
    USDTE.sol          (ERC20 6 decimals; mintable by owner for bootstrapping liquidity)
    WELTX.sol          (Wrapped ELTX)
    uniswap-v2-core/   (pinned tag; with LICENSE)
    uniswap-v2-periphery/
  /deploy/
    hardhat.config.ts (network 'eltx' with RPC https://rpc.eltx.online)
    scripts/
      00_deploy_weltx.ts
      01_deploy_uniswap_core.ts (Factory)
      02_deploy_uniswap_periphery.ts (Router with WELTX addr)
      03_deploy_tokens.ts (deploy ELTXToken + USDTE; mint initial 1B ELTX to treasury; grant MINTER role to owner only)
      04_seed_liquidity.ts (create ELTX/USDTE pair; add initial liquidity from treasury)
      verify_addresses.json
  /apps/
    /faucet/
      package.json + server.js (Express)
      .env.example
      src/
        index.ts (endpoint /drip: rate-limit per IP+address; max 0.5 ELTX / 24h; captcha-ready)
        wallet.ts (separate hot-wallet key; NEVER hardcode treasury key)
      pm2.config.cjs
      README.md (security notes + funding faucet)
    /swap-ui/
      nextjs app (pages / swap; connect wallet; auto-add network; config factory/router)
      public/branding/ (ELTX logo)
      .env.example
      README.md
    /add-network/
      tiny static page with “Add ELTX Network” button => wallet_addEthereumChain({ chainId: 0x4F2A0, chainName: "ELTX Chain", nativeCurrency:{name:"ELTX",symbol:"ELTX",decimals:18}, rpcUrls:["https://rpc.eltx.online"], blockExplorerUrls:["https://explorer.eltx.online"] })
  /ci/
    github-actions to build contracts, run tests, lint Docker files.
  /security/
    THREAT_MODEL.md (keys, faucet abuse, RPC abuse; recommendations)

========================
3) INFRA DETAILS (WRITE REAL FILES, NO PSEUDO)
========================
- Besu genesis.json:
  * chainId=20256, networkId=20256
  * ibft2: list of validator addresses (generate node1..node3 keys; pre-load validator keys)
  * NO EIP-1559 fee market; legacy gas only.
  * block gas limit ~30,000,000
  * base premine: fund the treasury + validator accounts (for bootstrapping)
- Each node’s config:
  * enable rpc: eth, net, web3, txpool, admin, clique/ibft if needed
  * host-allowlist= ["*"] (but put Cloudflare/Apache in front)
  * CORS: ["https://eltx.online"]
  * miningBeneficiary = treasury address (so ALL gas fees pay to treasury)
  * p2p port mapping; static-nodes.json connecting the 3 validators
- Docker Compose:
  * three besu services + shared network
  * volumes for data/keys
  * healthchecks
- Scripts:
  * init-ibft.sh: generate keys, create IBFT2 genesis with our validators, write static-nodes.json, run besu --genesis-file, etc.
  * set-gasprice.sh: curl JSON-RPC to set min gas price to 1 gwei by default.
- Reverse proxy:
  * Apache .htaccess examples for rpc.eltx.online, explorer.eltx.online, faucet.eltx.online
  * Add security headers, rate-limits, CORS allowlist (https://eltx.online)
- Cloudflare:
  * document required DNS and proxy settings (Orange cloud; SSL Full; caching rules bypass for /api, /drip)

========================
4) EXPLORER (BLOCKSCOUT)
========================
- Dockerized Blockscout connected to https://rpc.eltx.online
- Branding: name “ELTX Chain”, symbol ELTX, logo from /apps/swap-ui/public/branding
- Indexing settings + healthcheck
- Document admin creds and how to reindex
- Output explorer base URL env to README

========================
5) CONTRACTS + DEPLOY
========================
- ELTXToken.sol:
  * ERC20, Ownable, Mintable, Pausable, Permit (EIP-2612), 18 decimals
  * constructor mints 1,000,000,000 * 1e18 to TREASURY
  * onlyOwner can mint/burn/pause/unpause; timelock OWNER instructions doc
- USDTE.sol:
  * ERC20 6 decimals; mintable by owner (for bootstrap only; doc the risk; later replace with bridged USDC)
- WELTX.sol: standard WETH9-like wrapper renamed to WELTX
- Uniswap V2:
  * include core + periphery (pinned commit; GPL-3 license preserved)
  * deploy Factory => Router with WELTX address
  * script 04_seed_liquidity.ts adds initial ELTX/USDTE liquidity (values configurable via .env)
- Hardhat setup:
  * network 'eltx' RPC https://rpc.eltx.online, chainId=20256
  * tasks: deploy-all, verify, seed-liquidity, print-addresses
- Output deployment addresses JSON under /deploy/verify_addresses.json

========================
6) FAUCET APP
========================
- Node/Express with rate-limit (IP + wallet) + captcha-ready (stub)
- .env: RPC_URL, FAUCET_PRIVATE_KEY (hot), DRIP_AMOUNT=0.5 ELTX, COOLDOWN=24h, TREASURY=...
- POST /drip {address} → on success send 0.5 ELTX
- PM2 config for prod; sample systemd if needed
- Security notes: never put treasury private key in code; use a separate limited hot wallet funded from treasury.

========================
7) SWAP UI (NEXT.JS)
========================
- Simple swap: connect wallet, auto “Add ELTX Network”, show balances, allow ELTX<->USDTE swaps via Router
- Config file with Factory, Router, WELTX, ELTX/ USDTE addresses
- Display gas in ELTX and estimated fee in USD
- CORS with https://eltx.online; handle chain switch errors

========================
8) DOCS & RUNBOOK
========================
- README: one-command bootstrap for local (docker compose up -d) and for prod
- Step-by-step:
  1) generate validators + init IBFT2
  2) bring up nodes
  3) expose RPC behind Apache/Cloudflare
  4) deploy contracts (hardhat)
  5) seed liquidity
  6) run Blockscout
  7) run Faucet (PM2)
  8) publish Add-Network page
- Security checklist (ports, backups, key mgmt, rate-limits)
- Upgrade notes (adding validator #4 or #5)
- Postman collection for Faucet & RPC calls

========================
9) ACCEPTANCE TESTS
========================
- Hardhat tests:
  * can mint ELTX (owner only), transfer, pause/unpause
  * swap works on Router
  * WELTX deposit/withdraw
- Healthchecks: RPC (eth_blockNumber), Faucet (/drip dry-run), Explorer (homepage 200)
- Provide sample addresses after deploy (printed by scripts)

========================
10) LICENSES
========================
- Keep GPL-3 for Uniswap v2 (core/periphery)
- MIT for our code
- Include NOTICE with attributions

END. Produce all files and commands. No placeholders — use the values above unless overridden by .env. 
