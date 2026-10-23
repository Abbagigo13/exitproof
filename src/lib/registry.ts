/**
 * Shared constants for the RiskReceiptRegistry and ReceiptNFT contracts.
 * Import from here — never inline an address or ABI elsewhere.
 *
 * Set VITE_USE_MAINNET=true to point at Arc Mainnet.
 * Mainnet addresses are hardcoded below (deployed by the project owner via Remix).
 */

const isMainnet = import.meta.env.VITE_USE_MAINNET === 'true';

// Arc Testnet — deployed by Arc Studio (development only)
const TESTNET_ADDRESS = "0xf9394055a418cf0cf606c11c928d992bb1c55536" as const satisfies `0x${string}`;

// Arc Mainnet — deployed by project owner 0x617...aa17c
const MAINNET_ADDRESS = "0xcd8E285b61437EE0AfDdbD5EBA54c1A3ea6FBFb6" as const satisfies `0x${string}`;

export const REGISTRY_ADDRESS: `0x${string}` = isMainnet ? MAINNET_ADDRESS : TESTNET_ADDRESS;

export const REGISTRY_CHAIN_ID: number = isMainnet ? 5042 : 5042002;

export const REGISTRY_EXPLORER: string = isMainnet
  ? "https://explorer.arc.io"
  : "https://explorer.testnet.arc.io";

// ReceiptNFT contract — open-mint ERC-721 with fully on-chain metadata.
// Arc Testnet: deployed by Arc Studio.
// Arc Mainnet: deploy contracts/ReceiptNFT.sol via Remix to Arc Mainnet (chain 5042),
//              then replace RECEIPT_NFT_MAINNET_ADDRESS with the deployed address.
const RECEIPT_NFT_TESTNET = "0x53c0283587a2b2bb35cf150b926f6c9362f2adce" as const satisfies `0x${string}`;
const RECEIPT_NFT_MAINNET = "0xf107Eb78AC34a4D51493425Af7473d1B29c9053C" as const satisfies `0x${string}`;

export const RECEIPT_NFT_ADDRESS: `0x${string}` = isMainnet && RECEIPT_NFT_MAINNET
  ? RECEIPT_NFT_MAINNET
  : RECEIPT_NFT_TESTNET;

export const RECEIPT_NFT_CHAIN_ID: number = isMainnet && RECEIPT_NFT_MAINNET ? 5042 : 5042002;
export const RECEIPT_NFT_EXPLORER: string = isMainnet && RECEIPT_NFT_MAINNET
  ? "https://explorer.arc.io"
  : "https://explorer.testnet.arc.io";

export const REGISTRY_ABI = [
  {
    name: "anchorReceipt",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "receiptHash", type: "bytes32" },
      { name: "protocolRef", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "revokeReceipt",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "receiptHash", type: "bytes32" },
      { name: "reason", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "getReceipt",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "receiptHash", type: "bytes32" }],
    outputs: [
      { name: "anchorer", type: "address" },
      { name: "timestamp", type: "uint256" },
      { name: "protocolRef", type: "string" },
      { name: "revoked", type: "bool" },
    ],
  },
  {
    name: "isAnchored",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "receiptHash", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "exists",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "receiptHash", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getReceiptsByAnchorer",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "anchorer", type: "address" }],
    outputs: [{ name: "", type: "bytes32[]" }],
  },
  {
    name: "totalReceipts",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "version",
    type: "function",
    stateMutability: "pure",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "pause",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "unpause",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  // Events
  {
    name: "ReceiptAnchored",
    type: "event",
    inputs: [
      { name: "anchorer", type: "address", indexed: true },
      { name: "receiptHash", type: "bytes32", indexed: true },
      { name: "protocolRef", type: "string", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    name: "ReceiptRevoked",
    type: "event",
    inputs: [
      { name: "anchorer", type: "address", indexed: true },
      { name: "receiptHash", type: "bytes32", indexed: true },
      { name: "reason", type: "string", indexed: false },
    ],
  },
] as const;
