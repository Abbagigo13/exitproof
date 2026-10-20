/**
 * Shared constants for the RiskReceiptRegistry contract.
 * Import from here — never inline the address or ABI elsewhere.
 *
 * Set VITE_USE_MAINNET=true to point at Arc Mainnet.
 * The mainnet address is hardcoded below (deployed by the project owner).
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
] as const;
