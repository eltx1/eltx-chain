# Bridge Roadmap

This folder documents the future cross-chain bridge integration for ELTX Chain. The initial release does not run a bridge, but the design assumptions are documented so we can plug in a canonical rollup or external bridge later.

## Requirements
- Support outbound ELTX and ERC-20 transfers to Ethereum mainnet.
- Multi-signature validator set aligned with IBFT2 validators.
- On-chain light client verification of finalized IBFT2 headers.

## Next Steps
1. Evaluate Hyperledger Cactus and ChainBridge for compatibility with Besu IBFT2.
2. Define custody procedures for bridge hot/cold wallets.
3. Draft audits and penetration testing plan once implementation begins.

Until then, this directory keeps ADRs, diagrams, and scripts for experimentation.
