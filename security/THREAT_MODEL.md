# ELTX Chain Threat Model

## Assets
- **Treasury funds**: All gas fees and ELTX supply allocated to 0x695658fC245ABbaDD7a276fF73Ed44f7374275D1.
- **Validator keys**: Besu IBFT2 node private keys stored under `infra/besu/node*/keys`.
- **Faucet hot wallet**: Private key configured via `FAUCET_PRIVATE_KEY`.
- **RPC endpoints**: Public interface at https://rpc.eltx.online.
- **Explorer & Swap UI**: Public web apps served behind Apache and Cloudflare.

## Adversaries & Risks
1. **Key compromise**: Theft of validator or treasury keys leading to double signing or fund loss.
2. **RPC abuse**: High volume request floods, malicious transactions, or chain reorg attempts.
3. **Faucet draining**: Automated bots draining limited ELTX supply or using Sybil addresses.
4. **Smart contract bugs**: Minting/pause misconfiguration, liquidity pool manipulation, permit replay.
5. **Infrastructure outages**: Docker hosts failing, database corruption (Blockscout/Postgres).

## Controls
- Hardware security modules or dedicated vaults for treasury and validator keys; restrict `infra/besu/node*/keys` to root-only permissions.
- Cloudflare WAF + Apache IP allowlists (see `infra/reverse-proxy/apache/`) to throttle RPC/faucet/explorer traffic.
- Rate limits in faucet (`rate-limiter-flexible`) and captcha integration stub to deter bots.
- Contracts leverage audited OpenZeppelin implementations and unit tests in `deploy/test` covering minting, pausing, swaps, and WELTX flows.
- Blockscout/Postgres containers use persistent volumes with scheduled backups; healthchecks monitor readiness.
- CI workflow compiles/tests contracts on every PR (`ci/workflows/ci.yml`).

## Recommendations
- Add slashing alarms for IBFT validators using Prometheus + Alertmanager.
- Rotate faucet hot wallet monthly; keep max 500 ELTX in hot wallet.
- Enable besu `--rpc-http-authentication-enabled` with JWT for private admin RPC when migrating to production.
- Store PM2 logs with logrotate and send to centralized SIEM.
- Commission third-party audits for tokens and deployment scripts before mainnet launch.
