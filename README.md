# ExitProof — DeFi Risk Intelligence Platform

> Transparent, verifiable risk analysis for DeFi protocols — anchored on Arc Mainnet so the data can never be quietly revised.

**Live app:** https://exitproof-gules.vercel.app

---

## Try It Now (Judge Guide)

The fastest way to see everything working end-to-end:

1. **Open the app** — go to https://exitproof-gules.vercel.app and click **Enter ExitProof**
2. **Browse protocols** — the dashboard loads 50+ live protocols from DefiLlama with real TVL and risk scores. Click any card to open it.
3. **Run an exit stress test** — in the protocol detail, open the **Exit Stress** tab and run a scenario. See slippage and time-to-exit estimates.
4. **Generate a risk receipt** — open the **Receipt** tab, click **Compute SHA-256**. A tamper-proof hash of the full assessment appears.
5. **Anchor it on Arc Mainnet** — connect MetaMask (Arc Mainnet, chain ID 5042, RPC `https://rpc.mainnet.arc.io`). Click **Anchor this hash on Arc Mainnet**, confirm the transaction. Gas is paid in USDC.
6. **Verify it on-chain** — click the explorer link in the confirmation, or go to the **Verify** tab and paste the hash. The contract returns who anchored it, when, and for which protocol.
7. **Mint a Receipt NFT** — still in the Receipt tab, click **Mint Receipt NFT**. This calls the ReceiptNFT contract on Arc Mainnet and mints an ERC-721 with fully on-chain metadata (no IPFS).
8. **See your receipts** — click **My Receipts** in the nav. Your anchored receipts and minted NFTs appear here, read directly from the Arc RPC.
9. **Watch the live feed** — go to **Arc Ecosystem**. The live receipt feed shows your anchor appearing in real time. The block counter in the header ticks every ~500ms, proving Arc's sub-second finality.
10. **Try the AI guide** — click the sparkle button (bottom-right). Ask "How are risk scores calculated?" or "What is a risk receipt?"

**No account needed. No ETH needed. Gas is USDC.**

### Deployed contracts on Arc Mainnet

| Contract | Address | Explorer |
|---|---|---|
| RiskReceiptRegistry | `0xcd8E285b61437EE0AfDdbD5EBA54c1A3ea6FBFb6` | [view](https://explorer.arc.io/address/0xcd8E285b61437EE0AfDdbD5EBA54c1A3ea6FBFb6) |
| ReceiptNFT | `0xf107Eb78AC34a4D51493425Af7473d1B29c9053C` | [view](https://explorer.arc.io/address/0xf107Eb78AC34a4D51493425Af7473d1B29c9053C) |

---

## The Problem

DeFi moves fast. Protocols launch, get forked, get exploited, and get abandoned — often within months. Investors, DAOs, and protocols themselves need to answer one question before committing capital: **how risky is this protocol right now?**

Existing risk tooling has three critical gaps:

1. **Opacity**: risk scores from aggregators are black-box numbers. You can see the result but not the reasoning, the weights, or the evidence behind it.
2. **No accountability**: a risk report can be silently updated after a hack to show the "warning signs were always there" — there is no way to prove what the assessment said at a specific point in time.
3. **Trust centralisation**: you have to trust the analyst or the platform that published the score. A single compromised or pressured data provider can move billions of dollars in the wrong direction.

---

## The Solution

ExitProof is an open, client-side DeFi risk intelligence platform that:

- **Fetches live data** from DefiLlama (TVL, category, audit count, chain distribution) and derives transparent, reproducible risk scores across five axes: smart contract risk, liquidity risk, governance risk, oracle risk, and counterparty risk
- **Shows the reasoning**: every score is backed by visible evidence — audits, exploit history, oracle configuration, governance structure — not a single opaque number
- **Issues risk receipts**: a JSON snapshot of the full risk assessment at a point in time, with a SHA-256 hash you can verify independently
- **Anchors that hash on-chain**: one transaction on Arc Testnet writes the receipt hash to `RiskReceiptRegistry` — an immutable, timestamped, publicly verifiable record of what the assessment said and when
- **Lets anyone verify**: the Verify tab reads the on-chain receipt directly — paste any hash and see who anchored it, when, and for which protocol

The result: risk assessments that are transparent about their methodology, immutable after they are published, and verifiable by anyone without trusting the platform.

---

## Features

| Feature | Description |
|---|---|
| Live protocol data | 50+ protocols from DefiLlama with real TVL, chain, and category data |
| Composite risk scoring | Five-factor weighted model: smart contract, liquidity, governance, oracle, counterparty |
| Protocol browser | Search, filter by category/chain/risk level, sort by TVL or risk score |
| Exit stress simulator | Model liquidity fragmentation and time-to-exit under adverse conditions |
| What-If Lab | Adjust TVL, audit count, chain concentration and see score change in real time |
| Evidence register | Per-factor evidence items with citations |
| Risk receipt | JSON export + SHA-256 hash of the full assessment snapshot |
| On-chain anchoring | Write the receipt hash to `RiskReceiptRegistry` on Arc Mainnet |
| Receipt NFT mint | Mint an ERC-721 with fully on-chain metadata via `ReceiptNFT` on Arc Mainnet |
| Receipt verification | Look up any hash on-chain: anchorer, timestamp, protocol reference |
| Premium features | 0.1 USDC unlocks the full evidence register and verified receipt badge |
| Shareable links | `?protocol=<id>` links and `?receipt=<b64>` self-contained snapshot URLs |
| Compare page | Side-by-side risk comparison of any two protocols |
| Yield Risk page | 50 protocols ranked by risk-adjusted USDC yield estimate |
| Wallet Risk page | Portfolio risk score for any Arc address, read from Arc RPC |
| Watchlist | Bookmark protocols with threshold alerts and USDC on-chain signals |
| My Receipts | All your anchored receipts and minted NFTs, read from Arc RPC |
| Arc Ecosystem page | Live block counter, live receipt feed, Arc chain facts |
| AI guide | Floating assistant answering questions about the app and risk methodology |

---

## Architecture

```
Browser (React + Vite)
  ├── DefiLlama API           → live TVL / category / chain / audit data
  ├── Arc Testnet RPC         → read/write RiskReceiptRegistry
  ├── wagmi v2 + ConnectKit   → wallet connection & signing
  └── URL params              → shareable protocol & receipt links
```

No application backend. All computation happens client-side. The only persistent state is the on-chain `RiskReceiptRegistry` contract.

See [docs/1.architecture.md](docs/1.architecture.md) for a full breakdown.

---

## Smart Contracts

Both contracts are deployed on **Arc Mainnet** (chain ID 5042). Gas is paid in USDC.

### RiskReceiptRegistry
- Address: `0xcd8E285b61437EE0AfDdbD5EBA54c1A3ea6FBFb6`
- [View on explorer](https://explorer.arc.io/address/0xcd8E285b61437EE0AfDdbD5EBA54c1A3ea6FBFb6)

```solidity
function anchorReceipt(bytes32 receiptHash, string calldata protocolRef) external
function getReceipt(bytes32 receiptHash) external view returns (address anchorer, uint256 timestamp, string memory protocolRef, bool revoked)
function totalReceipts() external view returns (uint256)
```

### ReceiptNFT
- Address: `0xf107Eb78AC34a4D51493425Af7473d1B29c9053C`
- [View on explorer](https://explorer.arc.io/address/0xf107Eb78AC34a4D51493425Af7473d1B29c9053C)
- Open mint, no fee, fully on-chain metadata (data URI, no IPFS)

```solidity
function mint(bytes32 receiptHash, string calldata protocolRef, string calldata riskLevel, uint256 riskScore) external
function tokenURI(uint256 tokenId) public view returns (string memory) // returns data:application/json;base64,...
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- [Foundry](https://book.getfoundry.sh) (for contract work)
- A browser wallet (MetaMask or equivalent) connected to Arc Mainnet

### Arc Mainnet Network Details

| Field | Value |
|---|---|
| Network name | Arc |
| Chain ID | 5042 |
| RPC URL | `https://rpc.mainnet.arc.io` |
| Currency symbol | USDC |
| Block explorer | `https://explorer.arc.io` |

### Run Locally

```bash
git clone <this-repo>
cd exitproof

# Install dependencies
bun install

# Start the dev server
bun run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build for Production

```bash
bun run build
```

Output goes to `dist/`.

### Contract Development

```bash
# Build contracts
forge build

# Run tests
forge test -vv

# Deploy (requires Circle SCP credentials)
bun run contracts:deploy
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript |
| Styling | Tailwind CSS, framer-motion |
| Web3 | wagmi v2, viem v2, ConnectKit |
| Contracts | Solidity 0.8.28, Foundry |
| Chain | Arc Mainnet (USDC as native gas, chain ID 5042) |
| Data | DefiLlama public API |

---

## Documentation

| Doc | Contents |
|---|---|
| [Architecture](docs/1.architecture.md) | System design, data flows, directory structure |
| [Code Style](docs/2.code_style.md) | TypeScript, React, Tailwind, onchain conventions |
| [Security](docs/3.security.md) | Threat model, contract security, frontend security, mainnet checklist |
| [Testing](docs/4.testing.md) | Foundry tests, Vitest unit tests, CI checklist |
| [Design System](docs/5.design_system.md) | Colour tokens, typography, components, motion guidelines |

---

## Roadmap

- [ ] Server-side receipt verification endpoint (tamper-proof verifier)
- [ ] Historical receipt timeline per protocol
- [ ] Governance proposal risk delta alerts
- [ ] Multi-chain comparison view
- [ ] PDF receipt export with embedded QR code linking to on-chain anchor
- [ ] Mainnet deployment with multi-sig treasury

---

## Disclaimer

ExitProof is a research and transparency tool. Risk scores are algorithmically derived from publicly available data and do not constitute financial advice. Always conduct your own research before making investment decisions.

---

## License

MIT
