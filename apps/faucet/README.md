# ELTX Faucet

Node.js faucet service for dispensing small amounts of ELTX to builders. The faucet uses a dedicated hot wallet and enforces IP and address rate limits.

## Setup

```bash
cp .env.example .env
pnpm install # or npm install
yarn build   # compile TypeScript
```

Fund the hot wallet with ELTX from the treasury. The faucet should never store the treasury key.

## Running Locally

```bash
yarn dev
```

## Production

```bash
yarn build
pm2 start pm2.config.cjs
```

## Security Notes
- Only fund the faucet with a limited amount of ELTX and monitor balances daily.
- Rotate the hot wallet if a leak is suspected.
- Cloudflare Turnstile/Recaptcha can be integrated by populating `CAPTCHA_SECRET` and verifying tokens in `src/index.ts` (stub included).
- Logs are rate-limited and sanitized to avoid leaking sensitive data.
