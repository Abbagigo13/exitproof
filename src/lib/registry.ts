/**
 * Shared constants for the RiskReceiptRegistry contract.
 * Import from here — never inline the address or ABI elsewhere.
 *
 * Set VITE_REGISTRY_ADDRESS in .env to override the default address.
 * Set VITE_USE_MAINNET=true to point at Arc Mainnet.
 */

const isMainnet = import.meta.env.VITE_USE_MAINNET === 'true';

// Testnet address (deployed by Arc Studio)
const TESTNET_ADDRESS = "0xf9394055a418cf0cf606c11c928d992bb1c55536" as const satisfies `0x${string}`;

// Mainnet address — set via VITE_REGISTRY_ADDRESS after you deploy
const MAINNET_ADDRESS = (import.meta.env.VITE_REGISTRY_ADDRESS ?? "") as `0x${string}`;

export const REGISTRY_ADDRESS: `0x${string}` = isMainnet
  ? MAINNET_ADDRESS
  : TESTNET_ADDRESS;

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
    name: "getReceipt",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "receiptHash", type: "bytes32" }],
    outputs: [
      { name: "anchorer", type: "address" },
      { name: "timestamp", type: "uint256" },
      { name: "protocolRef", type: "string" },
    ],
  },
  {
    name: "isAnchored",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "receiptHash", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
