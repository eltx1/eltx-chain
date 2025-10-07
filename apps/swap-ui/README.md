# ELTX Swap UI

Next.js interface for Uniswap V2 liquidity on ELTX Chain. Connect a wallet, add the ELTX network, and swap between ELTX and USDTE.

## Setup

```bash
cp .env.example .env.local
pnpm install # or npm/yarn
pnpm dev
```

Update `.env.local` with deployed factory, router, WELTX, and token addresses.

## Production Build

```bash
pnpm build
pnpm start
```

Deploy behind PM2 or systemd. Serve via Apache/Cloudflare using the reverse-proxy snippets in `infra/reverse-proxy`.
