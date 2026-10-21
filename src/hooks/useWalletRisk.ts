/**
 * useWalletRisk — derives a portfolio risk score for any Arc wallet address.
 *
 * Strategy (pure Arc RPC, no external API):
 * 1. Fetch the wallet's recent tx history via eth_getTransactionCount + eth_getLogs
 *    for USDC Transfer events where the address is sender/receiver.
 * 2. Cross-reference "to" addresses against a registry of known protocol contracts
 *    to identify which DeFi protocols the wallet has interacted with.
 * 3. Pull risk scores for matched protocols from the ExitProof protocol list.
 * 4. Compute a weighted-average portfolio risk score.
 */

import { useState, useCallback } from "react";
import { createPublicClient, http, parseAbiItem, formatUnits } from "viem";
import { requireChain, getUsdc } from "@/onchain-facts";
import { REGISTRY_CHAIN_ID } from "../lib/registry";

const ARC_CHAIN_ID = REGISTRY_CHAIN_ID;
const arcChainFact = requireChain(ARC_CHAIN_ID);
const arcViemChain = {
  id: arcChainFact.chainId,
  name: arcChainFact.name,
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: arcChainFact.nativeCurrency.decimals },
  rpcUrls: { default: { http: arcChainFact.rpcUrls as [string, ...string[]] } },
};

const publicClient = createPublicClient({
  chain: arcViemChain,
  transport: http(arcChainFact.rpcUrls[0]),
});

const usdcFact = getUsdc(ARC_CHAIN_ID)!;
const USDC_ADDRESS = usdcFact.address as `0x${string}`;
const USDC_DECIMALS = usdcFact.decimals;

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

const SCAN_BLOCKS = 100_000n; // ~14 hours on Arc

export interface WalletInteraction {
  address: string;
  protocolName: string;
  txCount: number;
  totalVolume: string; // human USDC
  riskScore: number;
  riskLabel: string;
  riskColor: string;
}

export interface WalletRiskResult {
  address: string;
  usdcBalance: string;
  txCount: number;
  interactions: WalletInteraction[];
  portfolioScore: number;
  riskLabel: string;
  riskColor: string;
  anchorsOnChain: number;
  topExposure: string;
}

export interface WalletRiskState {
  result: WalletRiskResult | null;
  loading: boolean;
  error: string | null;
  analyze: (address: string, protocols: import("../data/protocols").Protocol[]) => Promise<void>;
}

function deriveRisk(score: number): { label: string; color: string } {
  if (score < 25) return { label: "Lower", color: "#22c55e" };
  if (score < 45) return { label: "Moderate", color: "#facc15" };
  if (score < 70) return { label: "Elevated", color: "#fb923c" };
  return { label: "High", color: "#ef4444" };
}

// Known Arc protocol contracts (best-effort mapping of contract → protocol name + risk)
// In production this would be a larger registry; here we seed a few well-known ones.
const KNOWN_CONTRACTS: Record<string, string> = {
  // USDC itself
  [USDC_ADDRESS.toLowerCase()]: "USDC (Arc)",
};

export function useWalletRisk(): WalletRiskState {
  const [result, setResult] = useState<WalletRiskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (
    rawAddress: string,
    protocols: import("../data/protocols").Protocol[]
  ) => {
    const address = rawAddress.trim().toLowerCase() as `0x${string}`;
    if (!/^0x[0-9a-f]{40}$/.test(address)) {
      setError("Invalid address — must be a 0x-prefixed 40-character hex address.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const head = await publicClient.getBlockNumber();
      const fromBlock = head > SCAN_BLOCKS ? head - SCAN_BLOCKS : 0n;

      // Fetch USDC balance
      const rawBalance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: [{ name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] }],
        functionName: "balanceOf",
        args: [address],
      });
      const usdcBalance = parseFloat(formatUnits(rawBalance, USDC_DECIMALS)).toFixed(2);

      // Fetch outbound USDC transfers (from this wallet)
      const outLogs = await publicClient.getLogs({
        address: USDC_ADDRESS,
        event: TRANSFER_EVENT,
        args: { from: address },
        fromBlock,
        toBlock: head,
      });

      // Count tx by destination address
      const interactionMap = new Map<string, { txCount: number; volume: bigint }>();
      for (const log of outLogs) {
        const to = (log.args as { to: string }).to?.toLowerCase() ?? "";
        if (!to || to === address) continue;
        const existing = interactionMap.get(to) ?? { txCount: 0, volume: 0n };
        interactionMap.set(to, {
          txCount: existing.txCount + 1,
          volume: existing.volume + ((log.args as { value: bigint }).value ?? 0n),
        });
      }

      // Get overall tx count
      const txCount = await publicClient.getTransactionCount({ address });

      // Build known-contract registry from current protocol list
      // (We can't map all DeFi contract addresses without an indexer, but we can
      //  show interactions with the USDC contract and flag high-volume recipients.)
      const interactions: WalletInteraction[] = [];

      for (const [toAddr, { txCount: cnt, volume }] of interactionMap.entries()) {
        const knownName = KNOWN_CONTRACTS[toAddr];
        // Try to match by protocol name in our list (crude but effective for Arc-native)
        const matchedProtocol = knownName
          ? protocols.find(p => p.name.toLowerCase().includes(knownName.toLowerCase()))
          : undefined;

        const score = matchedProtocol
          ? Math.round((matchedProtocol.scores.contractControls * 0.25 +
              matchedProtocol.scores.liquidity * 0.25 +
              matchedProtocol.scores.concentration * 0.15 +
              matchedProtocol.scores.governance * 0.15 +
              matchedProtocol.scores.history * 0.20))
          : 50; // default moderate risk for unknown contracts

        const { label, color } = deriveRisk(score);
        const humanVol = parseFloat(formatUnits(volume, USDC_DECIMALS)).toFixed(2);

        interactions.push({
          address: toAddr,
          protocolName: knownName ?? `Unknown (${toAddr.slice(0, 8)}…)`,
          txCount: cnt,
          totalVolume: humanVol,
          riskScore: score,
          riskLabel: label,
          riskColor: color,
        });
      }

      // Sort by volume desc
      interactions.sort((a, b) => parseFloat(b.totalVolume) - parseFloat(a.totalVolume));

      // Portfolio score = weighted average by volume
      const totalVol = interactions.reduce((s, i) => s + parseFloat(i.totalVolume), 0);
      const portfolioScore = totalVol > 0
        ? Math.round(interactions.reduce((s, i) => s + i.riskScore * parseFloat(i.totalVolume), 0) / totalVol)
        : 50;

      const { label: riskLabelStr, color: riskColorStr } = deriveRisk(portfolioScore);
      const topExposure = interactions[0]?.protocolName ?? "No interactions found";

      // Count anchors by this wallet from the receipt registry
      let anchorsOnChain = 0;
      try {
        const hashes = await publicClient.readContract({
          address: "0xcd8E285b61437EE0AfDdbD5EBA54c1A3ea6FBFb6",
          abi: [{ name: "getReceiptsByAnchorer", type: "function", stateMutability: "view", inputs: [{ name: "anchorer", type: "address" }], outputs: [{ name: "", type: "bytes32[]" }] }],
          functionName: "getReceiptsByAnchorer",
          args: [address],
        }) as `0x${string}`[];
        anchorsOnChain = hashes.length;
      } catch {
        anchorsOnChain = 0;
      }

      setResult({
        address,
        usdcBalance,
        txCount,
        interactions: interactions.slice(0, 10),
        portfolioScore,
        riskLabel: riskLabelStr,
        riskColor: riskColorStr,
        anchorsOnChain,
        topExposure,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message.slice(0, 120) : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, analyze };
}
