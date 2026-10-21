/**
 * useGasEstimate — estimates the USDC cost of a transaction on Arc.
 *
 * On Arc, gas is paid in USDC. The native gas token shares the same address
 * as ERC-20 USDC but at 18 decimals (vs 6 for the ERC-20 view).
 * Cost = gasUnits * gasPrice  (both in 18-dec USDC units)
 * Displayed as "$0.000X USDC" — the killer Arc demo moment.
 */

import { useEffect, useState } from "react";
import { createPublicClient, http, encodeFunctionData } from "viem";
import { requireChain } from "@/onchain-facts";
import { REGISTRY_CHAIN_ID, REGISTRY_ADDRESS, REGISTRY_ABI } from "../lib/registry";

const ARC_CHAIN_ID = REGISTRY_CHAIN_ID; // 5042 mainnet or 5042002 testnet
const arcChainFact = requireChain(ARC_CHAIN_ID);

// Viem chain object built from onchain-facts — no hardcoded values
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

/** The three transaction types we estimate gas for. */
export type GasEstimateTarget =
  | { type: "anchor"; hash: `0x${string}`; protocolId: string }
  | { type: "premium"; from: `0x${string}` }
  | { type: "verify" };

export interface GasEstimateResult {
  /** Human-readable cost, e.g. "$0.00012 USDC" */
  display: string;
  /** Raw cost in native 18-dec units (bigint) */
  rawNative: bigint;
  loading: boolean;
  error: string | null;
}

/** Convert native 18-dec gas cost to a human USDC string */
function formatGasCost(rawNative: bigint): string {
  // 1 native unit = 1e-18 USDC (18-dec view). ERC-20 USDC = 1e-6.
  // Display in human USDC: divide by 1e18, show up to 6 significant digits.
  const usdcFloat = Number(rawNative) / 1e18;
  if (usdcFloat < 0.000001) return "< $0.000001 USDC";
  if (usdcFloat < 0.01) return `~$${usdcFloat.toFixed(6)} USDC`;
  return `~$${usdcFloat.toFixed(4)} USDC`;
}

const USDC_TRANSFER_GAS = 65_000n; // typical ERC-20 transfer
const ANCHOR_GAS = 80_000n;        // anchorReceipt call
const VERIFY_GAS = 30_000n;        // static call (read) — shown for completeness

export function useGasEstimate(target: GasEstimateTarget | null): GasEstimateResult {
  const [display, setDisplay] = useState<string>("…");
  const [rawNative, setRawNative] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function estimate() {
      try {
        // Fetch gas price from Arc
        const gasPrice = await publicClient.getGasPrice();

        let gasUnits: bigint;
        if (target!.type === "anchor") {
          try {
            // Try a real estimate with a dummy sender (zero address is fine for reads)
            const data = encodeFunctionData({
              abi: REGISTRY_ABI,
              functionName: "anchorReceipt",
              args: [target!.type === "anchor" ? (target as { hash: `0x${string}` }).hash : ("0x" + "0".repeat(64)) as `0x${string}`, target!.type === "anchor" ? (target as { protocolId: string }).protocolId : "unknown"],
            });
            gasUnits = await publicClient.estimateGas({
              to: REGISTRY_ADDRESS,
              data,
              account: "0x0000000000000000000000000000000000000001",
            });
          } catch {
            gasUnits = ANCHOR_GAS;
          }
        } else if (target!.type === "premium") {
          gasUnits = USDC_TRANSFER_GAS;
        } else {
          gasUnits = VERIFY_GAS;
        }

        const cost = gasUnits * gasPrice;
        if (!cancelled) {
          setRawNative(cost);
          setDisplay(formatGasCost(cost));
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError("estimate failed");
          setDisplay("…");
          setLoading(false);
        }
      }
    }

    void estimate();
    return () => { cancelled = true; };
  }, [target?.type, target?.type === "anchor" ? (target as { hash: string }).hash : "", target?.type === "premium" ? (target as { from: string }).from : ""]);

  return { display, rawNative, loading, error };
}
