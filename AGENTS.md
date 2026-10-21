# ExitProof

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

DeFi risk intelligence dashboard. Users select a protocol, view composite risk scores across five factors, simulate exit stress and what-if scenarios, inspect evidence, generate a signed risk receipt, and anchor that receipt hash on Arc Testnet via the RiskReceiptRegistry contract.

## Deployed Contracts

| Contract | Network | Address | Explorer |
|---|---|---|---|
| RiskReceiptRegistry | Arc Mainnet | 0xcd8E285b61437EE0AfDdbD5EBA54c1A3ea6FBFb6 | [view](https://explorer.arc.io/address/0xcd8E285b61437EE0AfDdbD5EBA54c1A3ea6FBFb6) |
| RiskReceiptRegistry | Arc Testnet | 0xf9394055a418cf0cf606c11c928d992bb1c55536 | [view](https://explorer.testnet.arc.io/address/0xf9394055a418cf0cf606c11c928d992bb1c55536) |
| ReceiptNFT | Arc Testnet | 0x53c0283587a2b2bb35cf150b926f6c9362f2adce | [view](https://explorer.testnet.arc.io/address/0x53c0283587a2b2bb35cf150b926f6c9362f2adce) |

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
